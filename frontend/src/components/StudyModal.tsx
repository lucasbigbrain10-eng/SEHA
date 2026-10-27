'use client';

import { X, BookOpen, Compass, CheckCircle2, ExternalLink } from 'lucide-react';

export interface Study {
  id: string;
  titulo: string;
  autor: string;
  ano: string;
  veiculo: string;
  previa: string;
  metodologia: string;
  descobertas: string[];
  comoSehaAplica: string;
  fonteUrl: string;
}

interface StudyModalProps {
  study: Study | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudyModal({ study, isOpen, onClose }: StudyModalProps) {
  if (!isOpen || !study) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140F0C]/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-3xl w-full border border-[#E4DED4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4DED4] flex items-start justify-between bg-[#F4EFE6]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#EAE2D4] text-[#AF6A28] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
                {study.veiculo} • {study.ano}
              </span>
              <h3 className="font-serif-title font-semibold text-xl sm:text-2xl text-[#1E1713] mt-0.5">
                {study.titulo}
              </h3>
              <p className="text-xs text-[#7A6F64] mt-1 italic">
                {study.autor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6F64] hover:text-[#1E1713] p-1.5 rounded-lg hover:bg-[#EAE2D4] transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#524536] leading-relaxed">
          {/* Metodologia */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C531E]">
              Publicação e contexto
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-[#E6DCCF]">
              <p>{study.metodologia}</p>
            </div>
          </div>

          {/* Descobertas Centrais */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C531E]">
              Ideias apresentadas na publicação
            </h4>
            <ul className="space-y-2 bg-[#F6F1E7] border border-[#E6DCCF] rounded-2xl p-4 text-[#3E342B]">
              {study.descobertas.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#AF6A28] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Aplicação no MVP */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#1E1713] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#AF6A28]" />
              Como isso inspira o SEHA
            </h4>
            <div className="p-4 bg-[#F2ECE2] rounded-2xl border border-[#D5C9B8] text-[#3D332A] font-medium">
              <p>{study.comoSehaAplica}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4DED4] bg-[#F4EFE6] flex items-center justify-between">
          <span className="text-[11px] text-[#7A6F64]">
            Referências conceituais; não são garantias de resultado
          </span>
          <div className="flex items-center gap-2">
            <a href={study.fonteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDD5C7] px-3 py-2.5 text-xs font-semibold text-[#6B6158] hover:bg-white">Abrir fonte <ExternalLink className="h-3.5 w-3.5" /></a>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white text-xs font-semibold uppercase tracking-wider transition">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
