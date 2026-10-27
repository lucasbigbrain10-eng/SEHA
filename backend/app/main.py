import json
import re
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from .models import Usuario, Habito, Contexto, Estrategia, Feedback, DecisaoFeedback, EstadoConversa, AnotacoesHabito
from .auth import get_password_hash, verify_password, create_access_token, get_current_user
from .schemas import (
    UserRegister, UserLogin, UserOut, Token,
    HabitoCreate, HabitoUpdate, HabitoOut, HabitoDetail,
    ContextoCreate, ContextoOut,
    EstrategiaOut, EstrategiaAdjust, AnotacoesHabitoOut, AnotacoesHabitoUpdate,
    FeedbackCreate, FeedbackOut,
    FeedbackDecision,
    ChatRequest, ChatResponse
)
from .habit_rules import detectar_objetivo_amplo, gerar_estrategia_local, analisar_feedback_local
from .config import CORS_ORIGINS

# Cria as tabelas do banco no arranque
Base.metadata.create_all(bind=engine)

# Estados de contextualização sem hábito correspondente são registros órfãos de sessões antigas.
with Session(engine) as startup_db:
    startup_db.query(EstadoConversa).filter(
        ~EstadoConversa.habito_id.in_(startup_db.query(Habito.id))
    ).delete(synchronize_session=False)
    startup_db.commit()

app = FastAPI(
    title="SEHA API — Engenharia de Hábitos",
    description="Back-end para cadastro, login, contextualização e sugestões locais de hábitos.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

# ----------------- AUTH ENDPOINTS (RF01, RF02, RNF01, RNF02) -----------------

@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Verifica se o e-mail já existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endereço de e-mail já está cadastrado no sistema."
        )

    # Criação segura com senha em hash bcrypt (RNF01)
    novo_usuario = Usuario(
        nome=user_in.nome,
        email=user_in.email,
        senha_hash=get_password_hash(user_in.senha)
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    # Emissão do token de acesso
    token = create_access_token({"sub": novo_usuario.id, "email": novo_usuario.email})
    return {"access_token": token, "token_type": "bearer", "user": novo_usuario}


@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == credentials.email).first()
    if not user or not verify_password(credentials.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos. Verifique suas credenciais."
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=UserOut)
def get_me(current_user: Usuario = Depends(get_current_user)):
    return current_user


# ----------------- HABITOS ENDPOINTS (RF03, RF04, RNF03) -----------------

@app.get("/api/habitos", response_model=List[HabitoOut])
def list_habitos(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habitos = db.query(Habito).filter(Habito.usuario_id == current_user.id).order_by(Habito.criado_em.desc()).all()
    resultado = []
    for h in habitos:
        est_ativa = db.query(Estrategia).filter(Estrategia.habito_id == h.id, Estrategia.status == "ativa").first()
        resultado.append(
            HabitoOut(
                id=h.id,
                titulo=h.titulo,
                objetivo=h.objetivo,
                status=h.status,
                criado_em=h.criado_em,
                estrategia_atual_versao=est_ativa.versao if est_ativa else None
            )
        )
    return resultado


@app.post("/api/habitos")
def create_habito(
    habito_in: HabitoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificação de objetivo amplo (RF04)
    analise_amplo = detectar_objetivo_amplo(habito_in.titulo)

    novo_habito = Habito(
        usuario_id=current_user.id,
        titulo=habito_in.titulo,
        objetivo=habito_in.objetivo,
        status="contextualizacao"
    )
    db.add(novo_habito)
    db.commit()
    db.refresh(novo_habito)

    return {
        "habito": HabitoOut.from_orm(novo_habito),
        "analise_amplo": analise_amplo
    }


@app.patch("/api/habitos/{habito_id}", response_model=HabitoOut)
def atualizar_habito(
    habito_id: str,
    habito_in: HabitoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado ou sem permissão de edição.")

    habito.titulo = habito_in.titulo
    habito.objetivo = habito_in.objetivo
    try:
        db.commit()
        db.refresh(habito)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível salvar as alterações do hábito.") from exc
    return habito


@app.get("/api/habitos/{habito_id}", response_model=HabitoDetail)
def get_habito(
    habito_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado ou sem permissão de acesso.")

    contextos = db.query(Contexto).filter(Contexto.habito_id == habito.id).order_by(Contexto.criado_em.asc()).all()
    estrategias = db.query(Estrategia).filter(Estrategia.habito_id == habito.id).order_by(Estrategia.criado_em.desc()).all()
    estrategia_ativa = next((e for e in estrategias if e.status == "ativa"), None)

    feedbacks = []
    for est in estrategias:
        fb_list = db.query(Feedback).filter(Feedback.estrategia_id == est.id).order_by(Feedback.criado_em.desc()).all()
        feedbacks.extend(fb_list)

    return HabitoDetail(
        id=habito.id,
        titulo=habito.titulo,
        objetivo=habito.objetivo,
        status=habito.status,
        criado_em=habito.criado_em,
        contextos=[ContextoOut.from_orm(c) for c in contextos],
        estrategia_atual=EstrategiaOut.from_orm(estrategia_ativa) if estrategia_ativa else None,
        historico_estrategias=[EstrategiaOut.from_orm(e) for e in estrategias],
        feedbacks=[_feedback_out(f) for f in feedbacks],
        anotacoes=AnotacoesHabitoOut.model_validate(habito.anotacoes) if habito.anotacoes else AnotacoesHabitoOut()
    )


def _feedback_out(feedback: Feedback) -> FeedbackOut:
    analysis = analisar_feedback_local(
        feedback.resultado_percebido,
        feedback.descricao,
        feedback.dificuldades or "",
    )
    return FeedbackOut.model_validate(feedback).model_copy(update={
        "hipotese": analysis["hipotese"],
        "ajuste_sugerido": analysis["ajuste_sugerido"],
        "decisao_usuario": feedback.decisao_registrada.decisao if feedback.decisao_registrada else None,
    })


@app.patch("/api/habitos/{habito_id}/anotacoes", response_model=AnotacoesHabitoOut)
def atualizar_anotacoes(
    habito_id: str,
    anotacoes_in: AnotacoesHabitoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado ou sem permissão de acesso.")
    changes = anotacoes_in.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Informe pelo menos uma anotação para salvar.")
    notes = habito.anotacoes
    if not notes:
        notes = AnotacoesHabito(habito_id=habito.id)
        db.add(notes)
    for field, value in changes.items():
        setattr(notes, field, (value or "").strip())
    try:
        db.commit()
        db.refresh(notes)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível salvar a anotação. Tente novamente.") from exc
    return notes


# ----------------- CONTEXTO ENDPOINTS (RF05, RF06) -----------------

@app.post("/api/habitos/{habito_id}/contextos", response_model=ContextoOut)
def add_contexto(
    habito_id: str,
    contexto_in: ContextoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    categoria = contexto_in.categoria.strip()
    if not categoria or len(categoria) > 50 or not contexto_in.conteudo.strip():
        raise HTTPException(status_code=422, detail="Informe uma categoria e um contexto válido.")
    novo_contexto = None
    if contexto_in.origem == "correcao":
        novo_contexto = db.query(Contexto).filter(Contexto.habito_id == habito.id).order_by(Contexto.criado_em.desc()).first()
        if novo_contexto:
            novo_contexto.categoria = categoria
            novo_contexto.conteudo = contexto_in.conteudo.strip()
            novo_contexto.origem = "correcao"
    if not novo_contexto:
        novo_contexto = Contexto(
            habito_id=habito.id,
            categoria=categoria,
            conteudo=contexto_in.conteudo.strip(),
            origem=contexto_in.origem or "usuario"
        )
        db.add(novo_contexto)
    db.commit()
    db.refresh(novo_contexto)
    return novo_contexto


# ----------------- ESTRATÉGIA LOCAL (RF07, RF08, RF09) -----------------

@app.post("/api/habitos/{habito_id}/gerar-estrategia", response_model=EstrategiaOut)
def gerar_estrategia(
    habito_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    contextos = db.query(Contexto).filter(Contexto.habito_id == habito.id).all()
    contextos_dict = [{"categoria": c.categoria, "conteudo": c.conteudo} for c in contextos]

    # Desativa estratégias anteriores
    db.query(Estrategia).filter(Estrategia.habito_id == habito.id).update({"status": "substituida"})

    # Seleciona uma recomendação com regras locais determinísticas.
    resultado_local = gerar_estrategia_local(habito.titulo, contextos_dict)

    # Conta quantas versões já existiam
    count = db.query(Estrategia).filter(Estrategia.habito_id == habito.id).count()
    versao = f"v{count + 1}.0"

    nova_estrategia = Estrategia(
        habito_id=habito.id,
        versao=versao,
        conteudo=resultado_local["conteudo"],
        fundamentacao=resultado_local["fundamentacao"],
        gatilho=resultado_local["gatilho"],
        custo_inicio=resultado_local["custo_inicio"],
        ambiente=resultado_local["ambiente"],
        status="ativa"
    )
    db.add(nova_estrategia)
    
    # Atualiza status do hábito para ativo
    habito.status = "ativo"
    
    db.commit()
    db.refresh(nova_estrategia)
    return nova_estrategia


# ----------------- FEEDBACK & AJUSTE (RF10, RF11, RF12) -----------------

@app.post("/api/habitos/{habito_id}/feedbacks", response_model=FeedbackOut)
def registrar_feedback(
    habito_id: str,
    feedback_in: FeedbackCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    if feedback_in.resultado not in ("funcionou", "parcial", "nao_funcionou"):
        raise HTTPException(status_code=422, detail="Selecione um dos resultados disponíveis.")

    estrategia_ativa = db.query(Estrategia).filter(Estrategia.habito_id == habito.id, Estrategia.status == "ativa").first()
    if not estrategia_ativa:
        raise HTTPException(status_code=400, detail="O hábito ainda não possui uma estratégia ativa para registrar feedback.")

    # Hipóteses e sugestões são locais, explícitas e não alteram a estratégia.
    analise = analisar_feedback_local(feedback_in.resultado, feedback_in.descricao, feedback_in.dificuldades or "")

    novo_feedback = Feedback(
        estrategia_id=estrategia_ativa.id,
        descricao=feedback_in.descricao,
        resultado_percebido=feedback_in.resultado,
        dificuldades=feedback_in.dificuldades,
        analise_ia=f"{analise['observacao']}\n{analise['hipotese']}\n{analise['explicacao']}",
        decisao_ia=analise["decisao"]
    )
    db.add(novo_feedback)
    db.commit()
    db.refresh(novo_feedback)
    return _feedback_out(novo_feedback)


@app.post("/api/habitos/{habito_id}/feedbacks/{feedback_id}/decisao")
def decidir_sugestao_feedback(
    habito_id: str,
    feedback_id: str,
    decisao_in: FeedbackDecision,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")
    feedback = db.query(Feedback).join(Estrategia).filter(
        Feedback.id == feedback_id,
        Estrategia.habito_id == habito.id,
    ).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado para este hábito.")
    if feedback.decisao_registrada:
        raise HTTPException(status_code=409, detail="Este feedback já tem uma decisão registrada.")

    analysis = analisar_feedback_local(feedback.resultado_percebido, feedback.descricao, feedback.dificuldades or "")
    adjustment = None
    if decisao_in.decisao == "modificar":
        adjustment = (decisao_in.ajuste_personalizado or "").strip()
        if len(adjustment) < 5:
            raise HTTPException(status_code=422, detail="Escreva um ajuste com pelo menos 5 caracteres.")
    elif decisao_in.decisao == "aceitar":
        adjustment = analysis["ajuste_sugerido"]
        if not adjustment:
            raise HTTPException(status_code=422, detail="Este feedback não contém uma sugestão para aceitar.")

    created_strategy = None
    if adjustment:
        active_strategy = db.query(Estrategia).filter(
            Estrategia.habito_id == habito.id,
            Estrategia.status == "ativa",
        ).first()
        if not active_strategy or active_strategy.id != feedback.estrategia_id:
            raise HTTPException(status_code=409, detail="A estratégia mudou desde este feedback. Revise a estratégia atual antes de aplicar outro ajuste.")
        active_strategy.status = "substituida"
        count = db.query(Estrategia).filter(Estrategia.habito_id == habito.id).count()
        created_strategy = Estrategia(
            habito_id=habito.id,
            versao=f"v{count + 1}.0",
            conteudo=f"Para {habito.titulo}: {adjustment}",
            fundamentacao="Ajuste aplicado com decisão explícita do usuário a partir de uma hipótese local baseada neste feedback.",
            gatilho=active_strategy.gatilho,
            custo_inicio=active_strategy.custo_inicio,
            ambiente=active_strategy.ambiente,
            status="ativa",
        )
        db.add(created_strategy)

    db.add(DecisaoFeedback(
        feedback_id=feedback.id,
        decisao=decisao_in.decisao,
        ajuste_personalizado=adjustment if decisao_in.decisao == "modificar" else None,
    ))
    try:
        db.commit()
        if created_strategy:
            db.refresh(created_strategy)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Não foi possível registrar sua decisão. Tente novamente.") from exc
    return {
        "decisao": decisao_in.decisao,
        "estrategia": EstrategiaOut.model_validate(created_strategy) if created_strategy else None,
    }


@app.post("/api/habitos/{habito_id}/ajustes", response_model=EstrategiaOut)
def solicitar_ajuste(
    habito_id: str,
    ajuste_in: EstrategiaAdjust,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    estrategia_atual = db.query(Estrategia).filter(Estrategia.habito_id == habito.id, Estrategia.status == "ativa").first()
    if not estrategia_atual:
        raise HTTPException(status_code=400, detail="Nenhuma estratégia ativa para ajustar.")

    # Desativa versão anterior
    estrategia_atual.status = "substituida"

    # Cria nova versão
    count = db.query(Estrategia).filter(Estrategia.habito_id == habito.id).count()
    nova_versao = f"v{count + 1}.0"

    nova_estrategia = Estrategia(
        habito_id=habito.id,
        versao=nova_versao,
        conteudo=f"Ajuste solicitado pelo usuário: {ajuste_in.descricao_ajuste.strip()}",
        fundamentacao="Ajuste definido pelo usuário; não representa uma garantia de eficácia.",
        gatilho=estrategia_atual.gatilho,
        custo_inicio=estrategia_atual.custo_inicio,
        ambiente=estrategia_atual.ambiente,
        status="ativa"
    )
    db.add(nova_estrategia)
    db.commit()
    db.refresh(nova_estrategia)
    return nova_estrategia


# ----------------- EXCLUSÃO DE HÁBITOS E CONTEXTOS -----------------

@app.delete("/api/habitos/{habito_id}")
def delete_habito(
    habito_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado ou sem permissão para exclusão.")

    db.delete(habito)
    db.commit()
    return {"message": "Hábito excluído com sucesso.", "id": habito_id}


@app.delete("/api/habitos/{habito_id}/contextos/{contexto_id}")
def delete_contexto(
    habito_id: str,
    contexto_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    contexto = db.query(Contexto).filter(Contexto.id == contexto_id, Contexto.habito_id == habito.id).first()
    if not contexto:
        raise HTTPException(status_code=404, detail="Contexto não encontrado.")

    db.delete(contexto)
    db.commit()
    return {"message": "Contexto excluído com sucesso.", "id": contexto_id}


# ----------------- FLUXO GUIADO DE CONTEXTUALIZAÇÃO -----------------

@app.get("/api/habitos/{habito_id}/chat/estado", response_model=ChatResponse)
def estado_chat_habito(
    habito_id: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")
    state = db.query(EstadoConversa).filter(EstadoConversa.habito_id == habito.id).first()
    if not state:
        reply, options = _question_for_step("periodo")
        return {"reply": f"Vamos estruturar o hábito ‘{habito.titulo}’. {reply}", "options": options, "step": "periodo", "status": "ativa"}
    if state.status == "cancelada":
        return {"reply": "Esta conversa foi interrompida. Seu hábito e os dados salvos continuam disponíveis.", "options": ["Retomar"], "step": state.etapa, "status": state.status}
    if state.status == "concluida":
        return {"reply": "A contextualização deste hábito foi concluída. Você pode gerar a estratégia ou corrigir uma informação.", "options": ["Gerar estratégia", "Corrigir informação"], "step": state.etapa, "status": state.status}
    reply, options = _question_for_step(state.etapa)
    return {"reply": reply, "options": options, "step": state.etapa, "status": state.status}

@app.post("/api/habitos/{habito_id}/chat", response_model=ChatResponse)
def chat_habito(
    habito_id: str,
    chat_in: ChatRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habito = db.query(Habito).filter(Habito.id == habito_id, Habito.usuario_id == current_user.id).first()
    if not habito:
        raise HTTPException(status_code=404, detail="Hábito não encontrado.")

    state = db.query(EstadoConversa).filter(EstadoConversa.habito_id == habito.id).first()
    if not state:
        state = EstadoConversa(habito_id=habito.id)
        db.add(state)
        db.flush()
    answers = json.loads(state.respostas or "{}")
    latest = next((m.content.strip() for m in reversed(chat_in.messages) if m.role == "user"), "")
    normalized = re.sub(r"\s+", " ", latest.casefold()).strip(" .,!?")

    if normalized in {"cancele", "cancelar", "cancela", "pare", "parar", "deixa pra la", "deixa para la", "deixa pra lá", "deixa para lá"}:
        state.status = "cancelada"
        reply, options = "Tudo bem, interrompi esta conversa. Seu hábito e os dados já salvos continuam disponíveis.", []
    elif state.status == "cancelada" and normalized in ("retomar", "reiniciar", "começar de novo", "comecar de novo"):
        state.status, state.etapa, state.respostas = "ativa", "periodo", "{}"
        reply, options = _question_for_step("periodo")
    elif state.status == "cancelada":
        reply, options = "Esta conversa foi interrompida. Se quiser continuar, inicie uma nova contextualização pelo hábito.", []
    elif any(x in normalized for x in ("nao entendi", "não entendi", "como assim", "explica melhor", "não compreendi")):
        reply, options = _question_for_step(state.etapa)
        reply = "Sem problema. " + reply
    elif "?" in latest or normalized.startswith(("por que", "porque", "para que", "pra que", "o que significa")):
        reply, options = _question_for_step(state.etapa)
        reply = "Estou perguntando isso para adaptar a estratégia à sua rotina. " + reply
    elif normalized == "voltar":
        previous = {"dificuldade": "periodo", "alternativa": "dificuldade", "concluida": "alternativa"}
        if state.etapa in previous:
            state.etapa = previous[state.etapa]
            state.status = "ativa"
            reply, options = _question_for_step(state.etapa)
        else:
            reply, options = "Você já está na primeira pergunta. " + _question_for_step("periodo")[0], _question_for_step("periodo")[1]
    elif state.status == "concluida":
        reply, options = "A contextualização já foi concluída. Você pode gerar a estratégia ou corrigir uma informação salva.", ["Gerar estratégia", "Corrigir informação"]
    else:
        accepted = _parse_guided_answer(state.etapa, latest)
        if accepted is None:
            reply, options = _question_for_step(state.etapa)
            reply = "Não consegui identificar uma resposta válida. " + reply
        else:
            key = state.etapa
            answers[key] = accepted
            categories = {"periodo": "Rotina", "dificuldade": "Dificuldades", "alternativa": "Preferencias"}
            category = categories[key]
            context = db.query(Contexto).filter(Contexto.habito_id == habito.id, Contexto.categoria == category).first()
            if context:
                context.conteudo, context.origem = accepted, "chat_guiado"
            else:
                db.add(Contexto(habito_id=habito.id, categoria=category, conteudo=accepted, origem="chat_guiado"))
            next_step = {"periodo": "dificuldade", "dificuldade": "alternativa", "alternativa": "concluida"}[key]
            state.etapa = next_step
            if next_step == "concluida":
                state.status = "concluida"
                reply, options = "Contexto salvo. Já temos o necessário para montar uma estratégia prática para esse hábito.", ["Gerar estratégia"]
            else:
                reply, options = _question_for_step(next_step)
            state.respostas = json.dumps(answers, ensure_ascii=False)
    state.atualizado_em = __import__("datetime").datetime.utcnow()
    db.commit()
    return {"reply": reply, "options": options, "step": state.etapa, "status": state.status}


def _question_for_step(step: str):
    questions = {
        "periodo": ("Em que período pretende fazer este hábito?", ["Manhã", "Tarde", "Noite", "Horário variável", "Outro período"]),
        "dificuldade": ("O que pode dificultar a prática? Selecione uma ou mais opções.", ["Falta de tempo", "Esquecimento", "Falta de motivação", "Cansaço ou pouca energia", "Dificuldade para começar", "Ambiente desfavorável", "Distrações e interrupções", "Falta de recursos ou materiais", "Dificuldade em manter a consistência", "O hábito parece complexo demais", "Não sei identificar o problema", "Outro motivo"]),
        "alternativa": ("Qual ajuste quer experimentar primeiro?", ["Começar com 5 minutos", "Deixar o material preparado", "Associar o hábito a uma rotina existente", "Reduzir distrações", "Usar um lembrete", "Dividir o hábito em passos menores", "Outra alternativa"]),
    }
    return questions.get(step, ("", []))


def _parse_guided_answer(step: str, answer: str):
    if not answer or len(answer) > 250:
        return None
    normalized_answer = answer.casefold().strip()
    custom_prefix = re.match(r"^(outro período|outro motivo|outra alternativa|outro|outra):\s*(.+)$", answer, re.IGNORECASE)
    if custom_prefix and len(custom_prefix.group(2).strip()) >= 2:
        if step == "dificuldade":
            return f"Outro motivo: {custom_prefix.group(2).strip()}"
        return custom_prefix.group(2).strip()
    if step == "periodo":
        if any(x in normalized_answer for x in ("manha", "manhã", "cedo", "madrugada")): return "Manhã"
        if "tarde" in normalized_answer: return "Tarde"
        if any(x in normalized_answer for x in ("noite", "noturno")): return "Noite"
        if "variavel" in normalized_answer or "variável" in normalized_answer: return "Horário variável"
        if re.search(r"\b([01]?\d|2[0-3])\s*(h| horas?)\b", normalized_answer): return answer
    elif step == "dificuldade":
        selected = [part.strip() for part in answer.split(";") if part.strip()]
        difficulty_options = _question_for_step("dificuldade")[1]
        normalized_options = {option.casefold(): option for option in difficulty_options if option != "Outro motivo"}
        normalized_options.update({
            "desânimo": "Falta de motivação", "desanimo": "Falta de motivação",
        })
        mapped = []
        for part in selected:
            key = part.casefold()
            if key.startswith("outro motivo: ") and len(part.split(":", 1)[1].strip()) >= 2:
                mapped.append("Outro motivo: " + part.split(":", 1)[1].strip())
                continue
            if key in normalized_options:
                mapped.append(normalized_options[key])
            else:
                return None
        if mapped:
            return "; ".join(dict.fromkeys(mapped))
    elif step == "alternativa":
        if "5 minuto" in normalized_answer or "cinco minuto" in normalized_answer: return "Começar com 5 minutos"
        if "prepar" in normalized_answer or "material" in normalized_answer: return "Deixar o material preparado"
        if "associ" in normalized_answer or "rotina existente" in normalized_answer: return "Associar o hábito a uma rotina existente"
        if "distra" in normalized_answer: return "Reduzir distrações"
        if "lembrete" in normalized_answer: return "Usar um lembrete"
        if "passos menores" in normalized_answer or "dividir" in normalized_answer: return "Dividir o hábito em passos menores"
    return None
