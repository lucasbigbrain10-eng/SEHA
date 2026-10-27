'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, X } from 'lucide-react';
import { apiFetch } from '@/services/api';

interface GuidedState {
  reply: string;
  options: string[];
  step: string;
  status: string;
}

function ContextContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitId = searchParams.get('id');
  const habitTitle = searchParams.get('habito') || 'seu hábito';
  const [flow, setFlow] = useState<GuidedState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFlow = useCallback(async () => {
    if (!habitId) {
      setError('Não encontrei o hábito. Volte à lista e abra a contextualização novamente.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const state = await apiFetch<GuidedState>(`/api/habitos/${habitId}/chat/estado`);
      setFlow(state);
      setSelected([]);
      setCustomText('');
      setShowOther(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadFlow(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFlow]);

  const submit = async (answer: string) => {
    if (!habitId || saving || !answer.trim()) return;
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<GuidedState>(`/api/habitos/${habitId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: answer.trim() }] }),
      });
      setFlow(result);
      if (result.step !== flow?.step || result.status !== flow?.status) {
        setSelected([]);
        setCustomText('');
        setShowOther(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar sua resposta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const isMulti = flow?.step === 'dificuldade';
  const needsOther = flow?.step === 'periodo' ? 'Outro período' : flow?.step === 'dificuldade' ? 'Outro motivo' : 'Outra alternativa';
  const customResponseTooShort = selected.includes(needsOther) && customText.trim().length < 2;

  const chooseOption = (option: string) => {
    if (saving) return;
    if (option === needsOther) {
      setShowOther((current) => !current);
      if (isMulti) setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
      else setSelected([option]);
      return;
    }
    if (isMulti) {
      setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
    } else {
      setSelected([option]);
      setShowOther(false);
    }
  };

  const submitAnswer = () => {
    if (!flow) return;
    if (flow.step === 'dificuldade') {
      const values = selected.filter((item) => item !== 'Outro motivo');
      if (selected.includes('Outro motivo') && customText.trim()) values.push(`Outro motivo: ${customText.trim()}`);
      void submit(values.join('; '));
      return;
    }
    const choice = selected[0];
    if (choice === needsOther && customText.trim()) {
      void submit(`${choice}: ${customText.trim()}`);
    } else if (choice && choice !== needsOther) {
      void submit(choice);
    }
  };

  const generateStrategy = async () => {
    if (!habitId || saving || flow?.status !== 'concluida') return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/habitos/${habitId}/gerar-estrategia`, { method: 'POST' });
      router.push(`/habitos/${habitId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a estratégia.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 grid place-items-center p-12 text-[#7A6F64]"><Loader2 className="animate-spin" /> Carregando perguntas…</div>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1 flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-[#E4DED4] pb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6F64] hover:text-[#1E1713]"><ArrowLeft className="w-4 h-4" /> Meus hábitos</Link>
        {flow?.status !== 'concluida' && flow?.status !== 'cancelada' && <button type="button" disabled={saving} onClick={() => void submit('cancele')} className="inline-flex items-center gap-1.5 text-xs text-[#7A6F64] hover:text-rose-700 disabled:opacity-50"><X className="w-4 h-4" /> Cancelar contextualização</button>}
      </div>

      <section className="rounded-3xl border border-[#E4DED4] bg-[#FAF8F5] p-6 sm:p-8 space-y-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">Contextualização do hábito</span>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-semibold text-[#1E1713] mt-1">{habitTitle}</h1>
          <p className="text-sm text-[#6B6158] mt-3">{flow?.reply || 'Responda às opções para adaptar uma sugestão simples à sua rotina.'}</p>
        </div>

        {flow?.status === 'cancelada' ? (
          <div className="flex flex-wrap items-center gap-3"><p className="text-sm text-[#6B6158]">Seu hábito e os dados já salvos continuam preservados.</p><button type="button" disabled={saving} onClick={() => void submit('retomar')} className="rounded-xl bg-[#AF6A28] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><RotateCcw className="inline w-4 h-4 mr-2" />Retomar</button></div>
        ) : flow?.status === 'concluida' ? (
          <div className="flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void submit('voltar')} className="rounded-xl border border-[#DDD5C7] px-4 py-3 text-sm text-[#6B6158] disabled:opacity-50">Corrigir respostas</button><button type="button" disabled={saving} onClick={() => void generateStrategy()} className="rounded-xl bg-[#AF6A28] px-5 py-3 text-sm font-semibold text-white hover:bg-[#975A22] disabled:opacity-50">{saving ? 'Salvando…' : 'Gerar sugestão local'} <ArrowRight className="inline w-4 h-4 ml-1" /></button></div>
        ) : flow ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {flow.options.map((option) => {
                const active = selected.includes(option);
                return <button key={option} type="button" disabled={saving} aria-pressed={active} onClick={() => chooseOption(option)} className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:opacity-50 ${active ? 'border-[#AF6A28] bg-[#F7EFE4] text-[#8C531E] font-semibold' : 'border-[#DDD5C7] bg-white text-[#42362B] hover:border-[#AF6A28]'}`}>{isMulti && <span aria-hidden className="mr-2">{active ? '☑' : '□'}</span>}{option}</button>;
              })}
            </div>
            {(showOther || selected.includes(needsOther)) && <textarea rows={3} minLength={2} maxLength={240} value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Escreva sua resposta personalizada (mínimo de 2 caracteres)" disabled={saving} className="w-full rounded-xl border border-[#DDD5C7] bg-white p-3 text-sm outline-none focus:border-[#AF6A28] disabled:opacity-50" />}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => void submit('não entendi')} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] hover:bg-white disabled:opacity-50">Explique a pergunta</button>
              {flow.step !== 'periodo' && <button type="button" disabled={saving} onClick={() => void submit('voltar')} className="rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs text-[#6B6158] hover:bg-white disabled:opacity-50">Voltar</button>}
              <button type="button" disabled={saving || (!selected.length) || customResponseTooShort} onClick={submitAnswer} className="ml-auto rounded-xl bg-[#AF6A28] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#975A22] disabled:opacity-50">{saving ? 'Salvando…' : 'Continuar'} <ArrowRight className="inline w-4 h-4 ml-1" /></button>
            </div>
          </>
        ) : null}

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}<button type="button" onClick={() => void loadFlow()} className="ml-2 underline">Tentar novamente</button></div>}
        {saving && <div role="status" className="text-xs text-[#7A6F64]">Salvando sua resposta…</div>}
      </section>
    </main>
  );
}

export default function ContextoPage() {
  return <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6F64]">Carregando contextualização…</div>}><ContextContent /></Suspense>;
}
