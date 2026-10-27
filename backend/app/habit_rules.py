"""Regras locais determinísticas para recomendações e diagnóstico de tentativas."""

import unicodedata


def _normalizar(texto: str) -> str:
    decomposed = unicodedata.normalize("NFD", texto.casefold())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def detectar_objetivo_amplo(texto: str) -> dict:
    value = texto.casefold()
    terms = ("passar", "enem", "vestibular", "emagrecer", "fluente", "sucesso", "rico", "aprender")
    broad = any(term in value for term in terms) or len(texto.split()) < 3
    if not broad:
        return {"is_amplo": False, "comportamento_sugerido": texto}
    if any(term in value for term in ("estud", "passar", "enem")):
        suggestion = "Defina uma sessão curta de estudo para um assunto específico."
    elif any(term in value for term in ("emagrec", "peso")):
        suggestion = "Escolha uma atividade física pequena e recorrente."
    elif any(term in value for term in ("idioma", "inglês", "ingles", "fluente")):
        suggestion = "Escolha uma prática diária curta para o idioma."
    else:
        suggestion = f"Escolha uma ação pequena e recorrente relacionada a: {texto}."
    return {
        "is_amplo": True,
        "explicacao": "Este objetivo pode ficar mais fácil de acompanhar quando definido como uma ação pequena e recorrente.",
        "comportamento_sugerido": suggestion,
    }


def gerar_estrategia_local(titulo: str, contextos: list[dict]) -> dict:
    context = {item.get("categoria", ""): item.get("conteudo", "").strip() for item in contextos}
    period = context.get("Rotina") or "um período que caiba na sua rotina"
    difficulty = context.get("Dificuldades", "")
    alternative = context.get("Preferencias", "")
    suggestion = alternative or "comece por cinco minutos"
    content = f"Para {titulo}, reserve {period} e {suggestion}."
    if difficulty:
        content += f" Se encontrar esta dificuldade: {difficulty}, reduza o passo inicial ou escolha outro horário."
    return {
        "conteudo": content,
        "fundamentacao": "Regra local: usar o período e as escolhas informadas para propor um primeiro passo pequeno. A sugestão não garante um resultado.",
        "gatilho": f"No período escolhido: {period}.",
        "custo_inicio": f"Primeiro passo: {suggestion}.",
        "ambiente": "Prepare com antecedência o material necessário para o hábito.",
    }


def analisar_feedback_local(resultado: str, descricao: str, dificuldades: str) -> dict:
    evidencia = f"{descricao} {dificuldades}".strip()
    texto = _normalizar(evidencia)
    if resultado == "funcionou":
        return {
            "decisao": "manter",
            "observacao": "Você relatou que a estratégia funcionou nesta tentativa.",
            "hipotese": "Há um relato positivo nesta tentativa; isso, sozinho, não demonstra eficácia geral.",
            "explicacao": "Você pode manter a estratégia e observar os próximos registros.",
            "ajuste_sugerido": None,
        }

    if not texto or any(term in texto for term in ("nao sei", "nao identifiquei", "nao consegui identificar")):
        return {
            "decisao": "investigar",
            "observacao": "O resultado foi registrado, mas não há uma dificuldade identificada para relacionar a uma regra.",
            "hipotese": "Dados insuficientes para sugerir uma causa nesta tentativa.",
            "explicacao": "No próximo registro, descreva o que aconteceu antes ou durante a tentativa. Você também pode ajustar a estratégia manualmente.",
            "ajuste_sugerido": None,
        }

    if any(term in texto for term in ("esquec", "lembrete", "lembrei", "lembrou")):
        hypothesis = "O relato menciona esquecimento; um lembrete ligado a uma rotina pode ser testado."
        adjustment = "Defina um lembrete junto de uma rotina diária que já acontece."
    elif any(term in texto for term in ("tempo", "atras", "agenda", "ocupad", "demor")):
        hypothesis = "O relato menciona conflito de tempo ou agenda; um passo menor pode ser mais viável."
        adjustment = "Teste uma versão de cinco minutos do hábito no período escolhido."
    elif any(term in texto for term in ("cansad", "cansaco", "energia", "sono", "exaust")):
        hypothesis = "O relato menciona cansaço ou pouca energia; o horário ou o tamanho do primeiro passo podem contribuir."
        adjustment = "Teste o hábito em outro período ou reduza o primeiro passo para cinco minutos."
    elif any(term in texto for term in ("distrac", "interrup", "barulho", "ambiente", "material", "recurso")):
        hypothesis = "O relato menciona distrações, ambiente ou recursos; preparar o espaço pode reduzir uma barreira."
        adjustment = "Prepare o material antes e reduza uma distração do ambiente durante a tentativa."
    elif any(term in texto for term in ("comec", "inici", "motiv", "complex", "dificil", "difícil", "consisten")):
        hypothesis = "O relato menciona dificuldade para começar ou manter o passo; simplificar o início pode ser testado."
        adjustment = "Divida o hábito e teste apenas o primeiro passo por cinco minutos."
    else:
        return {
            "decisao": "investigar",
            "observacao": "O relato foi salvo, mas não correspondeu às categorias reconhecidas pelas regras locais.",
            "hipotese": "Dados insuficientes para formular uma hipótese segura a partir dos termos informados.",
            "explicacao": "Acrescente detalhes em um novo feedback ou ajuste a estratégia manualmente. Nenhuma mudança foi aplicada.",
            "ajuste_sugerido": None,
        }

    return {
        "decisao": "ajustar",
        "observacao": "A tentativa foi registrada; a hipótese abaixo é limitada aos termos informados.",
        "hipotese": hypothesis,
        "explicacao": "Esta é uma possibilidade para testar, não uma causa confirmada. A estratégia não será alterada sem sua decisão.",
        "ajuste_sugerido": adjustment,
    }
