"""Testes locais do fluxo MVP, isolados do banco configurado pelo usuário."""
import os
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.main import (  # noqa: E402
    create_habito,
    atualizar_habito,
    estado_chat_habito,
    atualizar_anotacoes,
    delete_habito,
    gerar_estrategia,
    get_habito,
    login,
    registrar_feedback,
    decidir_sugestao_feedback,
    register,
    chat_habito,
    _parse_guided_answer,
    _question_for_step,
)
from app.models import AnotacoesHabito, Contexto, EstadoConversa, Estrategia, Feedback, Usuario, Habito  # noqa: E402
from app.schemas import (  # noqa: E402
    ChatMessage,
    ChatRequest,
    FeedbackCreate,
    HabitoCreate,
    UserLogin,
    UserRegister,
    AnotacoesHabitoUpdate,
    HabitoUpdate,
    FeedbackDecision,
)


class MVPFlowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        registered = register(
            UserRegister(nome="Pessoa Teste", email="mvp@example.com", senha="senha123"),
            self.db,
        )
        self.user = registered["user"]
        self.other_user = Usuario(id="other", nome="Outra Pessoa", email="outra@example.com", senha_hash="x")
        self.db.add(self.other_user)
        self.db.commit()
        first = create_habito(HabitoCreate(titulo="Ler diariamente", objetivo="Ler um capítulo"), self.user, self.db)
        second = create_habito(HabitoCreate(titulo="Caminhar", objetivo="Caminhar um pouco"), self.other_user, self.db)
        self.habit_id = first["habito"].id
        self.other_habit_id = second["habito"].id

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def chat(self, text, habit_id=None, user=None):
        request = ChatRequest(messages=[ChatMessage(role="user", content=text)])
        return chat_habito(habit_id or self.habit_id, request, user or self.user, self.db)

    def test_guided_conversation_validation_navigation_and_persistence(self):
        self.assertEqual(estado_chat_habito(self.habit_id, self.user, self.db)["step"], "periodo")
        self.assertEqual(self.chat("Noite")["step"], "dificuldade")
        self.assertEqual(estado_chat_habito(self.habit_id, self.user, self.db)["step"], "dificuldade")
        self.assertEqual(self.chat("não entendi")["step"], "dificuldade")
        self.assertEqual(self.chat("texto sem relação")["step"], "dificuldade")
        self.assertEqual(len(self.db.query(Contexto).filter_by(habito_id=self.habit_id).all()), 1)

        self.assertEqual(self.chat("Voltar")["step"], "periodo")
        self.chat("Manhã")
        self.chat("Esquecimento")
        result = self.chat("Começar com 5 minutos")
        self.assertEqual(result["status"], "concluida")
        self.assertEqual(len(self.db.query(Contexto).filter_by(habito_id=self.habit_id).all()), 3)

    def test_cancel_preserves_habit_and_blocks_cross_user_access(self):
        result = self.chat("cancele", self.other_habit_id, self.other_user)
        self.assertEqual(result["status"], "cancelada")
        self.assertEqual(estado_chat_habito(self.other_habit_id, self.other_user, self.db)["status"], "cancelada")
        resumed = self.chat("retomar", self.other_habit_id, self.other_user)
        self.assertEqual(resumed["status"], "ativa")
        self.assertEqual(resumed["step"], "periodo")
        self.assertIsNotNone(self.db.query(Habito).filter_by(id=self.other_habit_id).first())
        with self.assertRaises(Exception) as error:
            self.chat("Noite", self.other_habit_id, self.user)
        self.assertEqual(error.exception.status_code, 404)

    def test_auth_strategy_feedback_adaptation_and_history(self):
        authenticated = login(UserLogin(email="mvp@example.com", senha="senha123"), self.db)
        self.assertEqual(authenticated["user"].id, self.user.id)
        strategy = gerar_estrategia(self.habit_id, self.user, self.db)
        self.assertEqual(strategy.status, "ativa")
        self.assertIn("Ler diariamente", strategy.conteudo)

        feedback = registrar_feedback(
            self.habit_id,
            FeedbackCreate(resultado="parcial", descricao="Fiz metade do planejado", dificuldades="Cansaço e pouca energia"),
            self.user,
            self.db,
        )
        self.assertEqual(feedback.decisao_ia, "ajustar")
        active = self.db.query(Estrategia).filter_by(habito_id=self.habit_id, status="ativa").one()
        self.assertEqual(active.id, strategy.id)
        details = get_habito(self.habit_id, self.user, self.db)
        self.assertEqual(len(details.feedbacks), 1)
        self.assertIn("cansaço", details.feedbacks[0].hipotese.casefold())
        self.assertIsNotNone(details.feedbacks[0].ajuste_sugerido)
        self.assertEqual(len(details.historico_estrategias), 1)

        decision = decidir_sugestao_feedback(
            self.habit_id, feedback.id, FeedbackDecision(decisao="aceitar"), self.user, self.db
        )
        self.assertEqual(decision["decisao"], "aceitar")
        active = self.db.query(Estrategia).filter_by(habito_id=self.habit_id, status="ativa").one()
        self.assertNotEqual(active.id, strategy.id)
        self.assertEqual(active.versao, "v2.0")
        details = get_habito(self.habit_id, self.user, self.db)
        self.assertEqual(details.feedbacks[0].decisao_usuario, "aceitar")
        self.assertEqual(len(details.historico_estrategias), 2)

    def test_local_flow_works_without_openai_key_and_options_are_handled(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            strategy = gerar_estrategia(self.habit_id, self.user, self.db)
            self.assertEqual(strategy.status, "ativa")

        for step in ("periodo", "dificuldade", "alternativa"):
            _, options = _question_for_step(step)
            for option in options:
                result = _parse_guided_answer(step, option)
                if option.startswith("Outro") or option.startswith("Outra"):
                    continue
                self.assertIsNotNone(result, f"Opção não tratada: {step}: {option}")
        self.assertEqual(_parse_guided_answer("periodo", "Outro período: Depois do almoço"), "Depois do almoço")
        self.assertEqual(_parse_guided_answer("dificuldade", "Outro motivo: reunião inesperada"), "Outro motivo: reunião inesperada")
        self.assertEqual(_parse_guided_answer("alternativa", "Outra alternativa: estudar com uma amiga"), "estudar com uma amiga")
        self.assertEqual(_parse_guided_answer("dificuldade", "Falta de tempo; Esquecimento"), "Falta de tempo; Esquecimento")
        self.assertIsNone(_parse_guided_answer("dificuldade", "Outro motivo"))
        self.assertIsNone(_parse_guided_answer("dificuldade", "falta"))
        self.assertIsNone(_parse_guided_answer("periodo", ""))
        self.assertIsNone(_parse_guided_answer("periodo", "resposta sem relação"))
        self.assertIsNone(_parse_guided_answer("dificuldade", "Outro motivo: x"))

    def test_api_rejects_short_custom_difficulty_without_advancing_then_accepts_correction(self):
        self.chat("Noite")
        self.assertEqual(estado_chat_habito(self.habit_id, self.user, self.db)["step"], "dificuldade")

        for invalid_answer in (
            "Falta de tempo; Outro motivo: x",
            "Falta de tempo; Outro motivo:   x  ",
            "Falta de tempo; Outro motivo:    ",
        ):
            result = self.chat(invalid_answer)
            self.assertEqual(result["step"], "dificuldade")
            self.assertIn("Não consegui identificar", result["reply"])
            self.assertEqual(
                self.db.query(Contexto).filter_by(habito_id=self.habit_id, categoria="Dificuldades").count(),
                0,
            )

        corrected = self.chat("Falta de tempo; Outro motivo: reuniões inesperadas")
        self.assertEqual(corrected["step"], "alternativa")
        saved = self.db.query(Contexto).filter_by(habito_id=self.habit_id, categoria="Dificuldades").one()
        self.assertEqual(saved.conteudo, "Falta de tempo; Outro motivo: reuniões inesperadas")

    def test_notes_save_edit_clear_persist_per_habit_and_enforce_owner(self):
        first = atualizar_anotacoes(
            self.habit_id, AnotacoesHabitoUpdate(gatilho="Após o café"), self.user, self.db
        )
        self.assertEqual(first.gatilho, "Após o café")
        updated = atualizar_anotacoes(
            self.habit_id, AnotacoesHabitoUpdate(gatilho="Depois da caminhada", ambiente="Mesa pronta"), self.user, self.db
        )
        self.assertEqual(updated.gatilho, "Depois da caminhada")
        self.db.expire_all()
        self.assertEqual(get_habito(self.habit_id, self.user, self.db).anotacoes.ambiente, "Mesa pronta")
        self.assertEqual(get_habito(self.other_habit_id, self.other_user, self.db).anotacoes.gatilho, "")
        cleared = atualizar_anotacoes(
            self.habit_id, AnotacoesHabitoUpdate(gatilho=""), self.user, self.db
        )
        self.assertEqual(cleared.gatilho, "")
        with self.assertRaises(Exception) as error:
            atualizar_anotacoes(self.habit_id, AnotacoesHabitoUpdate(ambiente="Alheio"), self.other_user, self.db)
        self.assertEqual(error.exception.status_code, 404)

    def test_habit_edit_valid_data_persists_and_enforces_owner(self):
        updated = atualizar_habito(
            self.habit_id,
            HabitoUpdate(titulo="Ler à noite", objetivo="Ler dois capítulos"),
            self.user,
            self.db,
        )
        self.assertEqual(updated.titulo, "Ler à noite")
        self.assertEqual(updated.objetivo, "Ler dois capítulos")
        self.db.expire_all()
        persisted = self.db.query(Habito).filter_by(id=self.habit_id).one()
        self.assertEqual(persisted.titulo, "Ler à noite")
        self.assertEqual(persisted.objetivo, "Ler dois capítulos")

        with self.assertRaises(Exception) as error:
            atualizar_habito(
                self.habit_id,
                HabitoUpdate(titulo="Alteração alheia", objetivo="Não deve ser salva"),
                self.other_user,
                self.db,
            )
        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(self.db.query(Habito).filter_by(id=self.habit_id).one().titulo, "Ler à noite")

    def test_habit_edit_rejects_invalid_values_and_does_not_commit(self):
        for payload in (
            {"titulo": "xx", "objetivo": "Objetivo válido"},
            {"titulo": "   ", "objetivo": "Objetivo válido"},
            {"titulo": "Título válido", "objetivo": "  "},
            {"titulo": "T" * 201, "objetivo": "Objetivo válido"},
        ):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                HabitoUpdate(**payload)

        persisted = self.db.query(Habito).filter_by(id=self.habit_id).one()
        self.assertEqual(persisted.titulo, "Ler diariamente")
        self.assertEqual(persisted.objetivo, "Ler um capítulo")

    def test_note_persistence_error_does_not_report_success(self):
        with patch.object(self.db, "commit", side_effect=RuntimeError("disk unavailable")):
            with self.assertRaises(Exception) as error:
                atualizar_anotacoes(self.habit_id, AnotacoesHabitoUpdate(gatilho="Nota não salva"), self.user, self.db)
        self.assertEqual(error.exception.status_code, 500)
        self.assertIsNone(self.db.query(AnotacoesHabito).filter_by(habito_id=self.habit_id).first())

    def test_deleting_habit_removes_all_dependents_without_touching_other_habit(self):
        strategy = gerar_estrategia(self.habit_id, self.user, self.db)
        self.db.add(Contexto(habito_id=self.habit_id, categoria="Rotina", conteudo="Noite"))
        self.db.add(EstadoConversa(habito_id=self.habit_id, etapa="periodo", status="ativa", respostas="{}"))
        self.db.add(AnotacoesHabito(habito_id=self.habit_id, gatilho="Alarme"))
        self.db.add(Feedback(estrategia_id=strategy.id, descricao="Tentei", resultado_percebido="parcial"))
        other_strategy = gerar_estrategia(self.other_habit_id, self.other_user, self.db)
        self.db.commit()

        delete_habito(self.habit_id, self.user, self.db)
        self.assertIsNone(self.db.query(Habito).filter_by(id=self.habit_id).first())
        self.assertIsNone(self.db.query(EstadoConversa).filter_by(habito_id=self.habit_id).first())
        self.assertIsNone(self.db.query(Contexto).filter_by(habito_id=self.habit_id).first())
        self.assertIsNone(self.db.query(AnotacoesHabito).filter_by(habito_id=self.habit_id).first())
        self.assertIsNone(self.db.query(Estrategia).filter_by(id=strategy.id).first())
        self.assertIsNone(self.db.query(Feedback).filter_by(estrategia_id=strategy.id).first())
        self.assertIsNotNone(self.db.query(Habito).filter_by(id=self.other_habit_id).first())
        self.assertIsNotNone(self.db.query(Estrategia).filter_by(id=other_strategy.id).first())

    def test_insufficient_feedback_needs_more_data_and_user_can_refuse(self):
        strategy = gerar_estrategia(self.habit_id, self.user, self.db)
        feedback = registrar_feedback(
            self.habit_id,
            FeedbackCreate(resultado="nao_funcionou", descricao="Não consegui realizar"),
            self.user,
            self.db,
        )
        self.assertIsNone(feedback.ajuste_sugerido)
        self.assertIn("insuficientes", feedback.hipotese.casefold())
        with self.assertRaises(Exception) as error:
            decidir_sugestao_feedback(self.habit_id, feedback.id, FeedbackDecision(decisao="aceitar"), self.user, self.db)
        self.assertEqual(error.exception.status_code, 422)

        refused = decidir_sugestao_feedback(
            self.habit_id, feedback.id, FeedbackDecision(decisao="recusar"), self.user, self.db
        )
        self.assertIsNone(refused["estrategia"])
        self.assertEqual(self.db.query(Estrategia).filter_by(habito_id=self.habit_id, status="ativa").one().id, strategy.id)
        with self.assertRaises(Exception) as cross_user:
            decidir_sugestao_feedback(self.habit_id, feedback.id, FeedbackDecision(decisao="recusar"), self.other_user, self.db)
        self.assertEqual(cross_user.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
