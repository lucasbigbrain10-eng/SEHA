'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Compass, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/services/api';

interface CreatedHabit {
  id: string;
  titulo: string;
}

interface CreateHabitResponse {
  habito: CreatedHabit;
  analise_amplo: { is_amplo: boolean; comportamento_sugerido?: string };
}

export default function NovoHabitoPage() {
  const router = useRouter();
  const [inputHabito, setInputHabito] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado especial: Objetivo Amplo Identificado pelo backend
  const [objetivoAmploDetectado, setObjetivoAmploDetectado] = useState(false);
  const [sugestaoComportamento, setSugestaoComportamento] = useState('');
  const [habitoCriadoId, setHabitoCriadoId] = useState<string | null>(null);

  const handleAnalisar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHabito.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch<CreateHabitResponse>('/api/habitos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: inputHabito,
          objetivo: inputHabito,
        }),
      });

      const { habito, analise_amplo } = response;
      setHabitoCriadoId(habito.id);

      if (analise_amplo?.is_amplo && !objetivoAmploDetectado) {
        setObjetivoAmploDetectado(true);
        setSugestaoComportamento(analise_amplo.comportamento_sugerido || 'Escolha uma ação pequena e recorrente relacionada ao seu objetivo.');
      } else {
        router.push(
          `/habitos/novo/contexto?id=${habito.id}&habito=${encodeURIComponent(habito.titulo)}`
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar hábito.');
    } finally {
      setLoading(false);
    }
  };

  const handleAceitarSugestao = () => {
    if (!habitoCriadoId) return;
    router.push(
      `/habitos/novo/contexto?id=${habitoCriadoId}&habito=${encodeURIComponent(sugestaoComportamento)}`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col justify-center">
      
      {/* Botão Voltar */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6F64] hover:text-[#1E1713] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Meus Hábitos
        </Link>
      </div>

      {/* Cartão Split com Stepper e Citação Lateral */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        
        {/* Lado Esquerdo: Formulário com Stepper */}
        <div className="lg:col-span-8 p-8 sm:p-12 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            {/* Stepper Superior (1 - 2 - 3 - 4) */}
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#AF6A28] text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <div className="w-10 h-px bg-[#E4DED4]"></div>
              <span className="w-6 h-6 rounded-full bg-[#EAE3D6] text-[#7A6F64] text-xs font-semibold flex items-center justify-center">
                2
              </span>
              <div className="w-10 h-px bg-[#E4DED4]"></div>
              <span className="w-6 h-6 rounded-full bg-[#EAE3D6] text-[#7A6F64] text-xs font-semibold flex items-center justify-center">
                3
              </span>
              <div className="w-10 h-px bg-[#E4DED4]"></div>
              <span className="w-6 h-6 rounded-full bg-[#EAE3D6] text-[#7A6F64] text-xs font-semibold flex items-center justify-center">
                4
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
                Passo 1: Definição Inicial
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-semibold text-[#1E1713]">
                O que você deseja desenvolver?
              </h1>
              <p className="text-xs text-[#7A6F64] leading-relaxed max-w-xl">
                Informe um hábito ou objetivo. Se a meta for ampla, regras locais sugerem uma ação recorrente para você revisar.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAnalisar} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
                Hábito ou objetivo (campo livre)
              </label>
              <textarea
                rows={3}
                value={inputHabito}
                onChange={(e) => {
                  setInputHabito(e.target.value);
                  setObjetivoAmploDetectado(false);
                }}
                placeholder="Digite aqui... Ex: Estudar matemática todos os dias ou Quero passar no ENEM"
                className="w-full text-xs sm:text-sm p-4 rounded-xl border border-[#DDD5C7] bg-white text-[#1E1713] focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition placeholder:text-[#A89D91] resize-none"
                disabled={loading}
                required
              />
            </div>

            {/* Exemplos Rápidos */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A6F64]">
              <span className="font-medium">Exemplos rápidos:</span>
              <button
                type="button"
                onClick={() => {
                  setInputHabito('Estudar matemática todos os dias');
                  setObjetivoAmploDetectado(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#EFE9DF] hover:bg-[#E5DDCF] text-[#473B2F] transition text-[11px]"
              >
                Hábito definido: &quot;Estudar matemática todos os dias&quot;
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputHabito('Quero passar no ENEM');
                  setObjetivoAmploDetectado(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#F5E8D8] hover:bg-[#EBD6BF] text-[#8C531E] border border-[#DFCBB5] transition text-[11px]"
              >
                Objetivo amplo: &quot;Quero passar no ENEM&quot;
              </button>
            </div>

            {/* Detecção de Objetivo Amplo */}
            {objetivoAmploDetectado && (
              <div className="rounded-2xl border border-[#DDCBBA] bg-[#F7EFE4] p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#AF6A28] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif-title font-semibold text-sm text-[#1E1713]">
                      Objetivo amplo identificado
                    </h4>
                    <p className="text-xs text-[#5C4F42] leading-relaxed">
                      &quot;{inputHabito}&quot; é um ótimo objetivo final, mas hábitos se formam a partir de
                      <strong> ações diárias concretas</strong>. Sugerimos focar em:
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E4DED4] text-xs font-semibold text-[#1E1713]">
                  {sugestaoComportamento}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAceitarSugestao}
                    className="px-4 py-2 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs uppercase tracking-wider font-semibold transition"
                  >
                    Usar comportamento sugerido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!habitoCriadoId) return;
                      router.push(
                        `/habitos/novo/contexto?id=${habitoCriadoId}&habito=${encodeURIComponent(inputHabito)}`
                      );
                    }}
                    className="px-3 py-2 rounded-lg border border-[#DDD5C7] text-xs text-[#6B6158] hover:bg-white"
                  >
                    Manter original
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loading || !inputHabito.trim()}
                className="px-7 py-3 rounded-xl bg-[#AF6A28] hover:bg-[#975A22] text-white font-medium text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lado Direito: Citação & Compasso Dourado */}
        <div className="lg:col-span-4 bg-[#F2ECE2] border-t lg:border-t-0 lg:border-l border-[#E4DED4] p-8 flex flex-col justify-center items-center text-center relative">
          <div className="space-y-6 max-w-xs">
            <div className="w-16 h-16 mx-auto relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#D5C9B8]"></div>
              <div className="absolute inset-2 rounded-full border border-[#C58B53]/40"></div>
              <Compass className="w-6 h-6 text-[#AF6A28]" />
            </div>

            <p className="font-serif-title italic text-xl text-[#3D332A] leading-relaxed">
              &ldquo;A jornada de mil milhas começa com um único passo.&rdquo;
            </p>
            <div className="h-0.5 w-10 bg-[#AF6A28] mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
