'use client';

import { useState } from 'react';
import { X, MessageSquarePlus, CheckCircle2, AlertCircle, XCircle, Send, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyVersion?: string;
  onSendFeedback?: (feedbackData: {
    resultado: 'funcionou' | 'parcial' | 'nao_funcionou';
    descricao: string;
    dificuldades: string;
  }) => void | Promise<void>;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  strategyVersion = 'v1.0',
  onSendFeedback,
}: FeedbackModalProps) {
  const [resultado, setResultado] = useState<'funcionou' | 'parcial' | 'nao_funcionou'>('parcial');
  const [descricao, setDescricao] = useState('');
  const [dificuldades, setDificuldades] = useState<string[]>([]);
  const [outraDificuldade, setOutraDificuldade] = useState('');
  const [detalhesAdicionais, setDetalhesAdicionais] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const selectedDifficulties = dificuldades.filter((item) => item !== 'Outro motivo');
      if (dificuldades.includes('Outro motivo')) selectedDifficulties.push(`Outro motivo: ${outraDificuldade.trim()}`);
      if (detalhesAdicionais.trim()) selectedDifficulties.push(detalhesAdicionais.trim());
      await onSendFeedback?.({ resultado, descricao, dificuldades: selectedDifficulties.join('; ') });
      setDescricao('');
      setDificuldades([]);
      setOutraDificuldade('');
      setDetalhesAdicionais('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140F0C]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-lg w-full border border-[#E4DED4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4DED4] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAE2D4] text-[#AF6A28] flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-semibold text-lg text-[#1E1713]">
                Registrar Feedback
              </h3>
              <p className="text-xs text-[#7A6F64]">
                Avalie a aplicação da estratégia ({strategyVersion})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6F64] hover:text-[#1E1713] p-1.5 rounded-lg hover:bg-[#EAE2D4] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 overflow-y-auto">
          <div>
            {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-2">
              Como foi sua tentativa?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setResultado('funcionou')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  resultado === 'funcionou'
                    ? 'border-[#AF6A28] bg-[#F7EFE4] text-[#8C531E] font-semibold'
                    : 'border-[#DDD5C7] bg-white text-[#7A6F64]'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${resultado === 'funcionou' ? 'text-[#AF6A28]' : 'text-[#A89D91]'}`} />
                <span className="text-xs">Funcionou</span>
              </button>

              <button
                type="button"
                onClick={() => setResultado('parcial')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  resultado === 'parcial'
                    ? 'border-[#AF6A28] bg-[#F7EFE4] text-[#8C531E] font-semibold'
                    : 'border-[#DDD5C7] bg-white text-[#7A6F64]'
                }`}
              >
                <AlertCircle className={`w-4 h-4 ${resultado === 'parcial' ? 'text-[#AF6A28]' : 'text-[#A89D91]'}`} />
                <span className="text-xs">Parcialmente</span>
              </button>

              <button
                type="button"
                onClick={() => setResultado('nao_funcionou')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  resultado === 'nao_funcionou'
                    ? 'border-[#AF6A28] bg-[#F7EFE4] text-[#8C531E] font-semibold'
                    : 'border-[#DDD5C7] bg-white text-[#7A6F64]'
                }`}
              >
                <XCircle className={`w-4 h-4 ${resultado === 'nao_funcionou' ? 'text-[#AF6A28]' : 'text-[#A89D91]'}`} />
                <span className="text-xs">Não funcionou</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
              O que aconteceu durante a tentativa?
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Consegui sentar para estudar no horário planejado, mas me distraí..."
              className="w-full text-xs sm:text-sm rounded-xl border border-[#DDD5C7] bg-white p-3.5 focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition resize-none placeholder:text-[#A89D91]"
              required
            />
          </div>

          <fieldset>
            <legend className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-2">
              O que dificultou ou facilitou? (opcional)
            </legend>
            <div className="flex flex-wrap gap-2">
              {['Falta de tempo', 'Esquecimento', 'Falta de motivação', 'Cansaço ou pouca energia', 'Dificuldade para começar', 'Ambiente ou distrações', 'Falta de materiais', 'Meta complexa demais', 'Não sei identificar', 'Outro motivo'].map((option) => {
                const selected = dificuldades.includes(option);
                return <button key={option} type="button" aria-pressed={selected} onClick={() => setDificuldades((current) => selected ? current.filter((item) => item !== option) : [...current, option])} className={`rounded-full border px-3 py-1.5 text-[11px] transition ${selected ? 'border-[#AF6A28] bg-[#F7EFE4] font-semibold text-[#8C531E]' : 'border-[#DDD5C7] bg-white text-[#6B6158]'}`}>{option}</button>;
              })}
            </div>
            {dificuldades.includes('Outro motivo') && <textarea rows={2} maxLength={240} value={outraDificuldade} onChange={(event) => setOutraDificuldade(event.target.value)} placeholder="Descreva o outro motivo (mínimo 2 caracteres)" className="mt-2 w-full rounded-xl border border-[#DDD5C7] bg-white p-3 text-xs sm:text-sm outline-none focus:border-[#AF6A28]" />}
          </fieldset>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
              Detalhes adicionais (opcional)
            </label>
            <textarea
              rows={2}
              value={detalhesAdicionais}
              onChange={(e) => setDetalhesAdicionais(e.target.value)}
              placeholder="Ex.: a reunião passou do horário e perdi o período planejado"
              className="w-full text-xs sm:text-sm rounded-xl border border-[#DDD5C7] bg-white p-3.5 focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition resize-none placeholder:text-[#A89D91]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E4DED4]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-[#7A6F64] hover:bg-[#EAE2D4] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !descricao.trim() || (dificuldades.includes('Outro motivo') && outraDificuldade.trim().length < 2)}
              className="px-5 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Enviar feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
