'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Sliders,
  MessageSquarePlus,
  Compass,
  Layers,
  AlertCircle,
  Trash2,
  History,
  Target,
  User,
  Loader2,
  Pencil,
} from 'lucide-react';
import FundamentationModal from '@/components/FundamentationModal';
import AdjustStrategyModal from '@/components/AdjustStrategyModal';
import FeedbackModal from '@/components/FeedbackModal';
import OperationStatus from '@/components/OperationStatus';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type NoteKey = 'gatilho' | 'custo_inicio' | 'ambiente';

interface HabitDetails {
  id: string;
  titulo: string;
  objetivo: string;
  status: string;
  contextos: { id: string; categoria: string; conteudo: string }[];
  estrategia_atual: { id: string; versao: string; conteudo: string; fundamentacao?: string; gatilho?: string; custo_inicio?: string; ambiente?: string; status: string } | null;
  historico_estrategias: { id: string; versao: string; conteudo: string; status: string; criado_em: string }[];
  feedbacks: { id: string; descricao: string; resultado_percebido: string; dificuldades?: string; analise_ia?: string; decisao_ia?: string; hipotese?: string | null; ajuste_sugerido?: string | null; decisao_usuario?: string | null }[];
  anotacoes: { gatilho: string; custo_inicio: string; ambiente: string; atualizado_em?: string | null };
}

function AreaHabitoContent() {
  const params = useParams();
  const router = useRouter();
  const habitoId = params?.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'estrategia' | 'analise' | 'contexto' | 'historico'>('estrategia');
  const [habitoData, setHabitoData] = useState<HabitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState(false);
  const [habitDraft, setHabitDraft] = useState({ titulo: '', objetivo: '' });
  const [savingHabit, setSavingHabit] = useState(false);
  const [habitEditError, setHabitEditError] = useState('');

  // Modais
  const [showFundamentation, setShowFundamentation] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Estado das operações em andamento
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processando…');
  const [noteDrafts, setNoteDrafts] = useState<Record<NoteKey, string>>({ gatilho: '', custo_inicio: '', ambiente: '' });
  const [noteStatus, setNoteStatus] = useState<Partial<Record<NoteKey, string>>>({});
  const [savingNote, setSavingNote] = useState<NoteKey | null>(null);
  const [feedbackDecisionLoading, setFeedbackDecisionLoading] = useState(false);
  const [feedbackDecisionError, setFeedbackDecisionError] = useState('');
  const [customAdjustment, setCustomAdjustment] = useState('');
  const [showCustomAdjustment, setShowCustomAdjustment] = useState(false);

  const fetchHabitoDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<HabitDetails>(`/api/habitos/${habitoId}`);
      setHabitoData(data);
      setNoteDrafts({ gatilho: data.anotacoes?.gatilho || '', custo_inicio: data.anotacoes?.custo_inicio || '', ambiente: data.anotacoes?.ambiente || '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar dados do hábito.');
    } finally {
      setLoading(false);
    }
  }, [habitoId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (habitoId && isAuthenticated) void fetchHabitoDetails();
  }, [habitoId, isAuthenticated, authLoading, router, fetchHabitoDetails]);

  // Excluir Hábito
  const handleDeleteHabito = async () => {
    if (!confirm(`Deseja realmente excluir permanentemente o hábito "${habitoData?.titulo}"? Todo o histórico de estratégias e feedbacks será apagado.`)) {
      return;
    }

    try {
      await apiFetch(`/api/habitos/${habitoId}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir hábito.');
    }
  };

  const handleSaveHabit = async () => {
    const titulo = habitDraft.titulo.trim();
    const objetivo = habitDraft.objetivo.trim();
    if (titulo.length < 3 || titulo.length > 200 || objetivo.length < 3) {
      setHabitEditError('Informe um nome de 3 a 200 caracteres e uma definição com pelo menos 3 caracteres.');
      return;
    }

    setSavingHabit(true);
    setHabitEditError('');
    try {
      const saved = await apiFetch<HabitDetails>(`/api/habitos/${habitoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ titulo, objetivo }),
      });
      setHabitoData((current) => current ? { ...current, titulo: saved.titulo, objetivo: saved.objetivo } : current);
      setHabitDraft({ titulo: saved.titulo, objetivo: saved.objetivo });
      setEditingHabit(false);
    } catch (err) {
      setHabitEditError(err instanceof Error ? err.message : 'Falha ao salvar as informações do hábito.');
    } finally {
      setSavingHabit(false);
    }
  };

  // Excluir Contexto
  const handleDeleteContexto = async (contextoId: string) => {
    if (!confirm('Deseja remover este registro de contexto?')) return;

    try {
      await apiFetch(`/api/habitos/${habitoId}/contextos/${contextoId}`, {
        method: 'DELETE',
      });
      setHabitoData((prev) => prev ? ({ ...prev, contextos: prev.contextos.filter((context) => context.id !== contextoId) }) : prev);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir contexto.');
    }
  };

  const handleEnviarAjuste = async (descricao: string) => {
    setShowProcessing(true);
    setProcessingMessage('Aplicando o ajuste…');
    try {
      await apiFetch(`/api/habitos/${habitoId}/ajustes`, {
        method: 'POST',
        body: JSON.stringify({ descricao_ajuste: descricao }),
      });
      await fetchHabitoDetails();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Falha ao aplicar ajuste.');
    } finally {
      setShowProcessing(false);
    }
  };

  const handleEnviarFeedback = async (data: {
    resultado: 'funcionou' | 'parcial' | 'nao_funcionou';
    descricao: string;
    dificuldades: string;
  }) => {
    setShowProcessing(true);
    setProcessingMessage('Salvando feedback…');
    try {
      await apiFetch(`/api/habitos/${habitoId}/feedbacks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await fetchHabitoDetails();
      setActiveTab('analise');
      setShowCustomAdjustment(false);
      setCustomAdjustment('');
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Falha ao registrar feedback.');
    } finally {
      setShowProcessing(false);
    }
  };

  const handleFeedbackDecision = async (
    feedbackId: string,
    decisao: 'aceitar' | 'recusar' | 'modificar',
    ajuste_personalizado?: string,
  ) => {
    setFeedbackDecisionLoading(true);
    setFeedbackDecisionError('');
    try {
      await apiFetch(`/api/habitos/${habitoId}/feedbacks/${feedbackId}/decisao`, {
        method: 'POST',
        body: JSON.stringify({ decisao, ajuste_personalizado }),
      });
      setShowCustomAdjustment(false);
      setCustomAdjustment('');
      await fetchHabitoDetails();
    } catch (err) {
      setFeedbackDecisionError(err instanceof Error ? err.message : 'Não foi possível registrar sua decisão.');
    } finally {
      setFeedbackDecisionLoading(false);
    }
  };

  const salvarAnotacao = async (key: NoteKey, value = noteDrafts[key]) => {
    setSavingNote(key);
    setNoteStatus((current) => ({ ...current, [key]: 'Salvando…' }));
    try {
      const saved = await apiFetch<HabitDetails['anotacoes']>(`/api/habitos/${habitoId}/anotacoes`, {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value }),
      });
      setNoteDrafts((current) => ({ ...current, [key]: saved[key] }));
      setHabitoData((current) => current ? { ...current, anotacoes: saved } : current);
      setNoteStatus((current) => ({ ...current, [key]: 'Salvo' }));
    } catch (err) {
      setNoteStatus((current) => ({ ...current, [key]: err instanceof Error ? `Erro: ${err.message}` : 'Erro ao salvar. Tente novamente.' }));
    } finally {
      setSavingNote(null);
    }
  };

  if (loading && !habitoData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-3 text-[#7A6F64]">
        <Loader2 className="w-8 h-8 text-[#AF6A28] animate-spin" />
        <p className="text-xs uppercase tracking-wider">Carregando área do hábito...</p>
      </div>
    );
  }

  if (error || !habitoData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-[#FAF8F5] rounded-3xl border border-rose-300 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-serif-title text-xl text-[#1E1713]">{error || 'Hábito não encontrado'}</h3>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2 rounded-lg bg-[#AF6A28] text-white text-xs uppercase tracking-wider font-semibold"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  const estAtiva = habitoData.estrategia_atual;
  const ultimoFeedback = habitoData.feedbacks?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
      
      {/* Voltar e Ação de Excluir Hábito */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6F64] hover:text-[#1E1713] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Meus Hábitos
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHabitDraft({ titulo: habitoData.titulo, objetivo: habitoData.objetivo });
              setHabitEditError('');
              setEditingHabit(true);
            }}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-[#DDD5C7] text-[#6B6158] bg-white hover:bg-[#FAF8F5] transition flex items-center gap-1 font-semibold"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar informações
          </button>
          <button
            onClick={handleDeleteHabito}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/80 transition flex items-center gap-1 font-semibold"
            title="Excluir este hábito"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Hábito
          </button>
        </div>
      </div>

      {/* Header do Hábito */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2E8DC] text-[#8C531E] border border-[#E1D1BF]">
                <Compass className="w-3 h-3 text-[#AF6A28]" />
                Status: {habitoData.status} • {estAtiva?.versao || 'v1.0'}
              </span>
            </div>
            {editingHabit ? (
              <div className="space-y-3 max-w-2xl">
                <label className="block space-y-1 text-xs font-semibold text-[#6B6158]">
                  Nome do hábito
                  <input
                    autoFocus
                    maxLength={200}
                    value={habitDraft.titulo}
                    onChange={(event) => setHabitDraft((current) => ({ ...current, titulo: event.target.value }))}
                    className="w-full rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-base font-normal text-[#1E1713] outline-none focus:border-[#AF6A28]"
                  />
                </label>
                <label className="block space-y-1 text-xs font-semibold text-[#6B6158]">
                  Definição
                  <textarea
                    rows={2}
                    value={habitDraft.objetivo}
                    onChange={(event) => setHabitDraft((current) => ({ ...current, objetivo: event.target.value }))}
                    className="w-full rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-sm font-normal text-[#1E1713] outline-none focus:border-[#AF6A28]"
                  />
                </label>
                {habitEditError && <p role="alert" className="text-xs text-rose-700">{habitEditError}</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={savingHabit} onClick={() => void handleSaveHabit()} className="rounded-lg bg-[#AF6A28] px-3 py-2 text-xs font-semibold text-white hover:bg-[#975A22] disabled:opacity-50">{savingHabit ? 'Salvando…' : 'Salvar'}</button>
                  <button type="button" disabled={savingHabit} onClick={() => { setEditingHabit(false); setHabitEditError(''); }} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] hover:bg-[#FAF8F5] disabled:opacity-50">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-serif-title text-3xl sm:text-4xl font-semibold text-[#1E1713]">
                  {habitoData.titulo}
                </h1>
                <p className="text-xs sm:text-sm text-[#7A6F64] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#8C8074]" />
                  {habitoData.objetivo}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFeedback(true)}
              className="px-4 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs uppercase tracking-wider font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              Registrar feedback
            </button>
            <button
              onClick={() => setShowAdjust(true)}
              className="px-4 py-2.5 rounded-lg bg-white border border-[#DDD5C7] text-[#1E1713] hover:bg-[#FAF8F5] text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-[#AF6A28]" />
              Solicitar ajuste
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#E4DED4] gap-8 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'estrategia', label: 'Estratégia Atual', icon: Layers },
            { id: 'analise', label: 'Diagnóstico de Feedback', icon: MessageSquarePlus },
            { id: 'contexto', label: 'Contexto Mapeado', icon: User },
            { id: 'historico', label: 'Histórico & Evolução', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-3 flex items-center gap-2 border-b-2 uppercase tracking-wider text-[11px] transition shrink-0 ${
                  isActive
                    ? 'border-[#AF6A28] text-[#AF6A28] font-bold'
                    : 'border-transparent text-[#7A6F64] hover:text-[#1E1713]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {showProcessing && <OperationStatus message={processingMessage} />}

      {/* ABA 1: ESTRATÉGIA ATUAL */}
      {activeTab === 'estrategia' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
                  Sugestão por regras locais
                </span>
                <h3 className="font-serif-title text-2xl font-semibold text-[#1E1713] mt-0.5">
                  Plano do hábito
                </h3>
              </div>
              <button
                onClick={() => setShowFundamentation(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#F4EFE6] border border-[#E1D6C5] text-[#8C531E] hover:bg-[#EAE2D4] text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Ver fundamentação
              </button>
            </div>

            <div className="p-4 bg-[#F5EFE5] rounded-2xl border border-[#E6DCCF] text-xs text-[#524536] leading-relaxed">
              Esta sugestão usa regras locais e as respostas registradas para este hábito. Ela não garante um resultado.
            </div>

            <div className="p-5 rounded-2xl border border-[#E4DED4] bg-white space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A89D91]">
                Plano de Ação Formulado
              </span>
              <p className="text-xs sm:text-sm text-[#2C231B] leading-relaxed">
                {estAtiva?.conteudo || 'Ainda não há sugestão salva para este hábito.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: 'gatilho', title: '1. Gatilho', placeholder: "Ex.: Logo após o primeiro copo d’água pela manhã" },
                { key: 'custo_inicio', title: '2. Custo de Início', placeholder: 'Ex.: Começar com apenas 15 minutos' },
                { key: 'ambiente', title: '3. Ambiente', placeholder: 'Ex.: Deixar o celular carregando em outro cômodo' },
              ] as const).map(({ key, title, placeholder }) => {
                const dirty = noteDrafts[key] !== (habitoData.anotacoes?.[key] || '');
                return (
                  <section key={key} className="rounded-2xl border border-[#E4DED4] bg-white p-4 sm:p-5 space-y-3">
                    <label htmlFor={`note-${key}`} className="block text-[10px] font-bold uppercase tracking-wider text-[#8C531E]">{title}</label>
                    <textarea id={`note-${key}`} rows={5} maxLength={5000} value={noteDrafts[key]} onChange={(event) => { setNoteDrafts((current) => ({ ...current, [key]: event.target.value })); setNoteStatus((current) => ({ ...current, [key]: 'Alterações não salvas' })); }} placeholder={placeholder} className="w-full resize-y rounded-xl border border-[#E4DED4] bg-[#FFFEFC] p-3 text-sm leading-relaxed text-[#2C231B] outline-none focus:border-[#AF6A28] placeholder:text-[#A89D91]" />
                    <div className="flex min-h-5 items-center justify-between gap-2 text-[10px]">
                      <span role={noteStatus[key]?.startsWith('Erro:') ? 'alert' : 'status'} className={noteStatus[key]?.startsWith('Erro:') ? 'text-rose-700' : 'text-[#7A6F64]'}>{noteStatus[key] || (dirty ? 'Alterações não salvas' : 'Salvo')}</span>
                      <span className="text-[#A89D91]">{noteDrafts[key].length}/5000</span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={!dirty || savingNote !== null} onClick={() => void salvarAnotacao(key)} className="rounded-lg bg-[#AF6A28] px-3 py-2 text-xs font-semibold text-white hover:bg-[#975A22] disabled:opacity-50">{savingNote === key ? 'Salvando…' : 'Salvar'}</button>
                      <button type="button" disabled={!noteDrafts[key] || savingNote !== null} onClick={() => { setNoteDrafts((current) => ({ ...current, [key]: '' })); void salvarAnotacao(key, ''); }} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] hover:bg-[#FAF8F5] disabled:opacity-50">Apagar nota</button>
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E4DED4] flex items-center justify-between text-xs text-[#8C8074]">
              <span>Versão da sugestão: {estAtiva?.versao || '—'}</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 space-y-6">
            <div className="space-y-3 pt-4 border-t border-[#E4DED4]">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7A6F64]">
                Feedbacks Registrados ({habitoData.feedbacks?.length || 0})
              </span>
              <div className="space-y-2 text-xs">
                {habitoData.feedbacks?.map((fb, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#EAE3D6]">
                    <span className="text-[#3E342B] truncate max-w-[200px]">{fb.descricao}</span>
                    <span className="text-[10px] font-semibold text-[#8C531E] uppercase">{fb.resultado_percebido}</span>
                  </div>
                ))}
                {(!habitoData.feedbacks || habitoData.feedbacks.length === 0) && (
                  <p className="text-[11px] text-[#A89D91]">Nenhum feedback registrado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: DIAGNÓSTICO DE FEEDBACK */}
      {activeTab === 'analise' && (
        <div className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E4DED4] pb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
                Resumo do feedback por regras locais
              </span>
              <h3 className="font-serif-title text-2xl font-semibold text-[#1E1713] mt-0.5">
                Diagnóstico de Aplicação
              </h3>
            </div>
            {ultimoFeedback && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F5E8D8] text-[#8C531E] border border-[#DFCBB5]">
                Resultado: {ultimoFeedback.resultado_percebido}
              </span>
            )}
          </div>

          {ultimoFeedback ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[#E4DED4] bg-white space-y-2">
                <h4 className="font-serif-title text-base font-semibold text-[#1E1713]">
                  Seu Relato
                </h4>
                <p className="text-xs text-[#5E544A] leading-relaxed">
                  &quot;{ultimoFeedback.descricao}&quot;
                </p>
                {ultimoFeedback.dificuldades && (
                  <p className="text-[11px] text-[#8C8074]">Dificuldades: {ultimoFeedback.dificuldades}</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#DDCBBA] bg-[#F7EFE4] p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E1713]">
                  <MessageSquarePlus className="w-4 h-4 text-[#AF6A28]" />
                  <span>Resumo por regras locais: {ultimoFeedback.decisao_ia || 'revisar'}</span>
                </div>
                <p className="text-xs text-[#5C4F42] leading-relaxed whitespace-pre-line">
                  {ultimoFeedback.hipotese || 'Ainda não há dados suficientes para formular uma hipótese.'}
                </p>
                {ultimoFeedback.ajuste_sugerido && <p className="text-xs text-[#5C4F42]">Possível ajuste: {ultimoFeedback.ajuste_sugerido}</p>}
                {!ultimoFeedback.ajuste_sugerido && <p className="text-xs text-[#5C4F42]">{ultimoFeedback.analise_ia || 'Você pode registrar mais detalhes no próximo feedback ou ajustar a estratégia manualmente.'}</p>}
                {ultimoFeedback.decisao_usuario ? (
                  <p role="status" className="text-xs font-semibold text-[#8C531E]">Decisão registrada: {ultimoFeedback.decisao_usuario}</p>
                ) : ultimoFeedback.ajuste_sugerido ? (
                  <div className="space-y-3 pt-2">
                    {showCustomAdjustment && <textarea rows={3} maxLength={1000} value={customAdjustment} onChange={(event) => setCustomAdjustment(event.target.value)} placeholder="Escreva o ajuste que deseja testar (mínimo 5 caracteres)" className="w-full rounded-xl border border-[#DDD5C7] bg-white p-3 text-sm outline-none focus:border-[#AF6A28]" />}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={feedbackDecisionLoading} onClick={() => void handleFeedbackDecision(ultimoFeedback.id, 'aceitar')} className="rounded-lg bg-[#AF6A28] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Aceitar e aplicar</button>
                      <button type="button" disabled={feedbackDecisionLoading} onClick={() => { setShowCustomAdjustment((current) => !current); setFeedbackDecisionError(''); }} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] disabled:opacity-50">Modificar sugestão</button>
                      {showCustomAdjustment && <button type="button" disabled={feedbackDecisionLoading || customAdjustment.trim().length < 5} onClick={() => void handleFeedbackDecision(ultimoFeedback.id, 'modificar', customAdjustment)} className="rounded-lg border border-[#AF6A28] px-3 py-2 text-xs font-semibold text-[#8C531E] disabled:opacity-50">Salvar meu ajuste</button>}
                      <button type="button" disabled={feedbackDecisionLoading} onClick={() => void handleFeedbackDecision(ultimoFeedback.id, 'recusar')} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] disabled:opacity-50">Recusar e manter estratégia</button>
                    </div>
                    {feedbackDecisionLoading && <p role="status" className="text-xs text-[#7A6F64]">Salvando sua decisão…</p>}
                    {feedbackDecisionError && <p role="alert" className="text-xs text-rose-700">{feedbackDecisionError}</p>}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#7A6F64]">
              Nenhum feedback registrado ainda. Aplique sua estratégia e registre o feedback para ver o diagnóstico.
            </div>
          )}
        </div>
      )}

      {/* ABA 4: CONTEXTO MAPEADO COM OPÇÃO DE EXCLUIR */}
      {activeTab === 'contexto' && (
        <div className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E4DED4] pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
              Base Individual de Conhecimento
            </span>
            <h3 className="font-serif-title text-2xl font-semibold text-[#1E1713] mt-0.5">
              Contexto Mapeado no Banco de Dados
            </h3>
            <p className="text-xs text-[#7A6F64]">
              Fatores da sua rotina considerados para formular e adaptar a estratégia. Você pode excluir contextos obsoletos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habitoData.contextos?.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[#E4DED4] bg-white flex flex-col justify-between space-y-3 group hover:border-[#D5C9B8] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C531E] bg-[#F5E8D8] px-2 py-0.5 rounded border border-[#E8D9C8]">
                      {item.categoria}
                    </span>
                    <button
                      onClick={() => handleDeleteContexto(item.id)}
                      className="text-[#A89D91] hover:text-rose-600 p-1 rounded transition"
                      title="Excluir este contexto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#42362B] leading-relaxed pt-2">
                    {item.conteudo}
                  </p>
                </div>
              </div>
            ))}
            {(!habitoData.contextos || habitoData.contextos.length === 0) && (
              <p className="text-xs text-[#7A6F64]">Nenhum contexto registrado especificamente.</p>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E4DED4] pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
              Ciclo Adaptativo Cumulativo
            </span>
            <h3 className="font-serif-title text-2xl font-semibold text-[#1E1713] mt-0.5">
              Linha do Tempo de Evolução
            </h3>
            <p className="text-xs text-[#7A6F64]">
              Consulte versões anteriores e os ajustes registrados para este hábito.
            </p>
          </div>

          <div className="relative border-l-2 border-[#DDD5C7] pl-6 ml-3 space-y-6">
            {habitoData.historico_estrategias?.map((entry, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white border-[#AF6A28] ring-2 ring-[#F5E8D8]" />

                <div className="p-4 rounded-2xl border border-[#E4DED4] bg-white space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1E1713] flex items-center gap-1.5">
                      Estratégia {entry.versao} {entry.status === 'ativa' && '(Atual)'}
                    </span>
                    <span className="text-[11px] text-[#A89D91]">
                      {new Date(entry.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E544A] leading-relaxed pt-1">
                    {entry.conteudo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      <FundamentationModal
        isOpen={showFundamentation}
        onClose={() => setShowFundamentation(false)}
        contextFactors={habitoData.contextos.map((context) => `${context.categoria}: ${context.conteudo}`)}
      />

      <AdjustStrategyModal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        strategyVersion={estAtiva?.versao || 'v1.0'}
        onSendAdjust={handleEnviarAjuste}
      />

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        strategyVersion={estAtiva?.versao || 'v1.0'}
        onSendFeedback={handleEnviarFeedback}
      />
    </div>
  );
}

export default function AreaHabitoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6F64]">Carregando área do hábito...</div>}>
      <AreaHabitoContent />
    </Suspense>
  );
}
