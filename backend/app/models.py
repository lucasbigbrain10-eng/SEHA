import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=generate_uuid)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

    habitos = relationship("Habito", back_populates="usuario", cascade="all, delete-orphan")


class Habito(Base):
    __tablename__ = "habitos"

    id = Column(String, primary_key=True, default=generate_uuid)
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    objetivo = Column(Text, nullable=False)
    status = Column(String(50), default="ativo")  # ativo, contextualizacao, aguardando_feedback, pausado
    criado_em = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="habitos")
    contextos = relationship("Contexto", back_populates="habito", cascade="all, delete-orphan")
    estrategias = relationship("Estrategia", back_populates="habito", cascade="all, delete-orphan")
    estado_conversa = relationship("EstadoConversa", back_populates="habito", cascade="all, delete-orphan", uselist=False)
    anotacoes = relationship("AnotacoesHabito", back_populates="habito", cascade="all, delete-orphan", uselist=False)


class Contexto(Base):
    __tablename__ = "contextos"

    id = Column(String, primary_key=True, default=generate_uuid)
    habito_id = Column(String, ForeignKey("habitos.id", ondelete="CASCADE"), nullable=False)
    categoria = Column(String(50), nullable=False)  # Rotina, Ambiente, Dificuldades, Preferencias
    conteudo = Column(Text, nullable=False)
    origem = Column(String(50), default="usuario")  # usuario, inferido_ia, correcao
    criado_em = Column(DateTime, default=datetime.utcnow)

    habito = relationship("Habito", back_populates="contextos")


class Estrategia(Base):
    __tablename__ = "estrategias"

    id = Column(String, primary_key=True, default=generate_uuid)
    habito_id = Column(String, ForeignKey("habitos.id", ondelete="CASCADE"), nullable=False)
    versao = Column(String(20), default="v1.0")
    conteudo = Column(Text, nullable=False)
    fundamentacao = Column(Text, nullable=True)
    gatilho = Column(String(200), nullable=True)
    custo_inicio = Column(String(200), nullable=True)
    ambiente = Column(String(200), nullable=True)
    status = Column(String(50), default="ativa")  # ativa, substituida, arquivada
    criado_em = Column(DateTime, default=datetime.utcnow)

    habito = relationship("Habito", back_populates="estrategias")
    feedbacks = relationship("Feedback", back_populates="estrategia", cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True, default=generate_uuid)
    estrategia_id = Column(String, ForeignKey("estrategias.id", ondelete="CASCADE"), nullable=False)
    descricao = Column(Text, nullable=False)
    resultado_percebido = Column(String(50), nullable=False)  # funcionou, parcial, nao_funcionou
    dificuldades = Column(Text, nullable=True)
    analise_ia = Column(Text, nullable=True)
    decisao_ia = Column(String(50), nullable=True)  # manter, ajustar, investigar, reformular
    criado_em = Column(DateTime, default=datetime.utcnow)

    estrategia = relationship("Estrategia", back_populates="feedbacks")
    decisao_registrada = relationship("DecisaoFeedback", back_populates="feedback", cascade="all, delete-orphan", uselist=False)


class DecisaoFeedback(Base):
    __tablename__ = "decisoes_feedback"

    feedback_id = Column(String, ForeignKey("feedbacks.id", ondelete="CASCADE"), primary_key=True)
    decisao = Column(String(20), nullable=False)  # aceitar, recusar, modificar
    ajuste_personalizado = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    feedback = relationship("Feedback", back_populates="decisao_registrada")


class EstadoConversa(Base):
    __tablename__ = "estados_conversa"

    habito_id = Column(String, ForeignKey("habitos.id", ondelete="CASCADE"), primary_key=True)
    etapa = Column(String(30), nullable=False, default="periodo")
    status = Column(String(20), nullable=False, default="ativa")
    respostas = Column(Text, nullable=False, default="{}")
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    habito = relationship("Habito", back_populates="estado_conversa")


class AnotacoesHabito(Base):
    __tablename__ = "anotacoes_habito"

    habito_id = Column(String, ForeignKey("habitos.id", ondelete="CASCADE"), primary_key=True)
    gatilho = Column(Text, nullable=False, default="")
    custo_inicio = Column(Text, nullable=False, default="")
    ambiente = Column(Text, nullable=False, default="")
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    habito = relationship("Habito", back_populates="anotacoes")
