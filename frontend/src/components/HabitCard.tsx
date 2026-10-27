'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Target, Compass, Trash2 } from 'lucide-react';

export interface Habit {
  id: string;
  titulo: string;
  objetivo: string;
  status: 'ativo' | 'contextualizacao' | 'aguardando_feedback' | 'pausado';
  criado_em: string;
  estrategiaVersao?: string;
  progresso?: string;
}

const statusMap: Record<Habit['status'], { label: string; badge: string }> = {
  ativo: {
    label: 'Estratégia Ativa',
    badge: 'bg-[#F2E8DC] text-[#8C531E] border-[#E1D1BF]',
  },
  contextualizacao: {
    label: 'Em Contextualização',
    badge: 'bg-[#EAE4D9] text-[#6A6055] border-[#D6CDBC]',
  },
  aguardando_feedback: {
    label: 'Aguardando Feedback',
    badge: 'bg-[#F4EBDB] text-[#9A6428] border-[#E7D6BE]',
  },
  pausado: {
    label: 'Pausado',
    badge: 'bg-[#ECE8E1] text-[#7A7268] border-[#DDD7CD]',
  },
};

export default function HabitCard({
  habit,
  onDelete,
}: {
  habit: Habit;
  onDelete?: (id: string) => void;
}) {
  const currentStatus = statusMap[habit.status] || statusMap.ativo;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Tem certeza de que deseja excluir o hábito "${habit.titulo}"? Esta ação removerá também seus contextos e histórico.`)) {
      if (onDelete) onDelete(habit.id);
    }
  };

  return (
    <div className="group rounded-2xl border border-[#E4DED4] bg-[#FAF8F5] p-5 hover:border-[#AF6A28] transition duration-200 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${currentStatus.badge}`}
          >
            <Compass className="w-3 h-3 text-[#AF6A28]" />
            {currentStatus.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8C8074]">
              {habit.estrategiaVersao || 'v1.0'}
            </span>
            {onDelete && (
              <button
                onClick={handleDelete}
                title="Excluir hábito"
                className="text-[#A89D91] hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-serif-title text-lg font-semibold text-[#1E1713] group-hover:text-[#AF6A28] transition mb-1">
          {habit.titulo}
        </h3>

        <p className="text-xs text-[#6B6158] line-clamp-2 mb-4 leading-relaxed flex items-start gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#8C8074] shrink-0 mt-0.5" />
          <span>{habit.objetivo}</span>
        </p>
      </div>

      <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between text-xs text-[#8C8074]">
        <span className="flex items-center gap-1 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          {habit.criado_em}
        </span>
        <Link
          href={`/habitos/${habit.id}`}
          className="font-medium text-xs text-white bg-[#AF6A28] hover:bg-[#975A22] px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-2xs"
        >
          Abrir hábito
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
