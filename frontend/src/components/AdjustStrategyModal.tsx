'use client';

import { useState } from 'react';
import { X, Sliders, Send, Loader2 } from 'lucide-react';

interface AdjustStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyVersion?: string;
  onSendAdjust?: (description: string) => void | Promise<void>;
}

export default function AdjustStrategyModal({
  isOpen,
  onClose,
  strategyVersion = 'v1.0',
  onSendAdjust,
}: AdjustStrategyModalProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError('');
    try {
      await onSendAdjust?.(description);
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar o ajuste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140F0C]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-lg w-full border border-[#E4DED4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#E4DED4] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAE2D4] text-[#AF6A28] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-semibold text-lg text-[#1E1713]">
                Solicitar Ajuste na Estratégia
              </h3>
              <p className="text-xs text-[#7A6F64]">
                Ajustando a estratégia atual ({strategyVersion})
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div>
            {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
              O que você gostaria de modificar?
            </label>
            <p className="text-xs text-[#7A6F64] mb-3">
              Descreva os pontos que não estão confortáveis na rotina proposta (ex: horário,
              duração, local ou gatilho).
            </p>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exemplo: Esse horário das 19h não funciona para mim porque fico muito cansado. Prefiro tentar no início da manhã..."
              className="w-full text-xs sm:text-sm rounded-xl border border-[#DDD5C7] bg-white p-4 focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition resize-none placeholder:text-[#A89D91]"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
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
              disabled={loading || !description.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Enviar ajuste
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
