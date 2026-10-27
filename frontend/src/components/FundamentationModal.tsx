'use client';

import { X, Compass } from 'lucide-react';

interface FundamentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextFactors?: string[];
  principles?: string[];
  sources?: { title: string; ref: string }[];
}

export default function FundamentationModal({
  isOpen,
  onClose,
  contextFactors = [],
  principles = [
    'Implementação de Intenções (Gollwitzer, 1999) — formulação clara de regras "Se... Então..." para reduzir atrito decisório',
    'Micro-passos e redução do custo de inicialização (BJ Fogg / James Clear) — meta mínima de 15 minutos para consolidar o gatilho',
    'Arquitetura de Escolhas (Thaler & Sunstein) — preparação prévia dos materiais no ambiente para disparar o comportamento automático',
  ],
  sources = [
    {
      title: 'Implementation Intentions: Strong Effects of Simple Plans',
      ref: 'Gollwitzer, P. M. (1999). American Psychologist, 54(7), 493–503.',
    },
    {
      title: 'Tiny Habits: The Small Changes That Change Everything',
      ref: 'Fogg, B. J. (2019). Houghton Mifflin Harcourt.',
    },
    {
      title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      ref: 'Clear, J. (2018). Avery Publishing.',
    },
  ],
}: FundamentationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140F0C]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-2xl w-full border border-[#E4DED4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4DED4] flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EAE2D4] text-[#AF6A28] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title font-semibold text-lg text-[#1E1713]">
                Fundamentação da Estratégia
              </h3>
              <p className="text-xs text-[#7A6F64]">
                Por que esta estratégia foi sugerida para você
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

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#524536]">
          {/* Fatores do Contexto */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C531E]">
              Fatores do seu contexto individual
            </h4>
            <ul className="space-y-2 bg-[#F6F1E7] border border-[#E6DCCF] rounded-2xl p-4 text-xs text-[#3E342B]">
              {contextFactors.length === 0 && <li className="text-[#7A6F64]">Nenhum fator de contexto foi registrado para este hábito.</li>}
              {contextFactors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#AF6A28] mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Princípios Científicos */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C531E]">
              Princípios comportamentais aplicados
            </h4>
            <div className="space-y-2.5">
              {principles.map((principle, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#E6DCCF] bg-white p-4 leading-relaxed text-[#3E342B]"
                >
                  {principle}
                </div>
              ))}
            </div>
          </div>

          {/* Fontes / Referências */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7A6F64]">
              Fontes & Referências científicas na base
            </h4>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="border-l-2 border-[#AF6A28] pl-3 py-0.5 text-[#524536]"
                >
                  <p className="font-semibold text-[#1E1713]">{source.title}</p>
                  <p className="italic text-[#7A6F64]">{source.ref}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4DED4] bg-[#F4EFE6] flex items-center justify-between">
          <span className="text-[11px] text-[#7A6F64]">
            Sugestão fundamentada adaptável ao longo do uso.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs font-semibold uppercase tracking-wider transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
