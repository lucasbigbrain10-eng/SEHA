from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class UserOut(BaseModel):
    id: str
    nome: str
    email: str
    criado_em: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- HABITO SCHEMAS ---
class HabitoCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=200)
    objetivo: str = Field(..., min_length=3)

class HabitoUpdate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=200)
    objetivo: str = Field(..., min_length=3)

    @field_validator("titulo", "objetivo")
    @classmethod
    def strip_and_require_content(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Informe pelo menos 3 caracteres válidos.")
        return value

class HabitoOut(BaseModel):
    id: str
    titulo: str
    objetivo: str
    status: str
    criado_em: datetime
    estrategia_atual_versao: Optional[str] = None

    class Config:
        from_attributes = True

# --- CONTEXTO SCHEMAS ---
class ContextoCreate(BaseModel):
    categoria: str  # Rotina, Ambiente, Dificuldades, Preferencias
    conteudo: str
    origem: Optional[str] = "usuario"

class ContextoOut(BaseModel):
    id: str
    categoria: str
    conteudo: str
    origem: str
    criado_em: datetime

    class Config:
        from_attributes = True

# --- ESTRATEGIA SCHEMAS ---
class EstrategiaOut(BaseModel):
    id: str
    versao: str
    conteudo: str
    fundamentacao: Optional[str]
    gatilho: Optional[str]
    custo_inicio: Optional[str]
    ambiente: Optional[str]
    status: str
    criado_em: datetime

    class Config:
        from_attributes = True

class AnotacoesHabitoOut(BaseModel):
    gatilho: str = ""
    custo_inicio: str = ""
    ambiente: str = ""
    atualizado_em: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnotacoesHabitoUpdate(BaseModel):
    gatilho: Optional[str] = Field(default=None, max_length=5000)
    custo_inicio: Optional[str] = Field(default=None, max_length=5000)
    ambiente: Optional[str] = Field(default=None, max_length=5000)

class EstrategiaAdjust(BaseModel):
    descricao_ajuste: str = Field(..., min_length=5)

# --- FEEDBACK SCHEMAS ---
class FeedbackCreate(BaseModel):
    resultado: Literal["funcionou", "parcial", "nao_funcionou"]
    descricao: str = Field(..., min_length=3)
    dificuldades: Optional[str] = None

class FeedbackDecision(BaseModel):
    decisao: Literal["aceitar", "recusar", "modificar"]
    ajuste_personalizado: Optional[str] = Field(default=None, min_length=5, max_length=1000)

class FeedbackOut(BaseModel):
    id: str
    resultado_percebido: str
    descricao: str
    dificuldades: Optional[str]
    analise_ia: Optional[str]
    decisao_ia: Optional[str]
    criado_em: datetime
    hipotese: Optional[str] = None
    ajuste_sugerido: Optional[str] = None
    decisao_usuario: Optional[str] = None

    class Config:
        from_attributes = True

# --- HABITO DETALHE COMPLETO ---
class HabitoDetail(BaseModel):
    id: str
    titulo: str
    objetivo: str
    status: str
    criado_em: datetime
    contextos: List[ContextoOut] = []
    estrategia_atual: Optional[EstrategiaOut] = None
    historico_estrategias: List[EstrategiaOut] = []
    feedbacks: List[FeedbackOut] = []
    anotacoes: AnotacoesHabitoOut = Field(default_factory=AnotacoesHabitoOut)

    class Config:
        from_attributes = True

# --- SCHEMAS DO FLUXO GUIADO ---
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=30)

class ChatResponse(BaseModel):
    reply: str
    options: List[str] = []
    step: str = "periodo"
    status: str = "ativa"
