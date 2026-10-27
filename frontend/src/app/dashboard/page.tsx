'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Sparkles,
  ArrowRight,
  Inbox,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import HabitCard, { Habit } from '@/components/HabitCard';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/services/api';

interface HabitRecord {
  id: string;
  titulo: string;
  objetivo: string;
  status: Habit['status'];
  criado_em: string;
  estrategia_atual_versao?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [habitos, setHabitos] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<'todos' | 'ativos' | 'pausados'>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabitos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<HabitRecord[]>('/api/habitos');
      const mapped: Habit[] = data.map((h) => ({
        id: h.id,
        titulo: h.titulo,
        objetivo: h.objetivo,
        status: h.status,
        criado_em: new Date(h.criado_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        estrategiaVersao: h.estrategia_atual_versao || 'Em preparação',
      }));
      setHabitos(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar hábitos do servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      const timer = window.setTimeout(() => { void fetchHabitos(); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, router, fetchHabitos]);

  const handleDeleteHabit = async (id: string) => {
    try {
      await apiFetch(`/api/habitos/${id}`, { method: 'DELETE' });
      setHabitos((prev) => prev.filter((h) => h.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir hábito.');
    }
  };

  const filteredHabits = habitos.filter((h) => {
    if (filter === 'ativos') return h.status === 'ativo';
    if (filter === 'pausados') return h.status === 'pausado';
    return true;
  });

  const activeHabit = habitos.find((h) => h.status === 'ativo') || habitos[0];

  if (authLoading || (loading && habitos.length === 0 && !error)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 space-y-3 text-[#7A6F64]">
        <Loader2 className="w-8 h-8 text-[#AF6A28] animate-spin" />
        <p className="text-xs uppercase tracking-wider">Carregando painel...</p>
      </div>
    );
  }

  const firstName = user?.nome?.split(' ')[0] || 'Gabriel';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-8">
      {/* HEADER DO USUÁRIO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E4DED4] pb-6">
        <div>
          <h1 className="font-serif-title text-3xl sm:text-4xl font-normal text-[#1E1713]">
            Olá, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F64] mt-1">
            Hoje é um bom dia para continuar o que importa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/habitos/novo"
            className="px-5 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white font-medium text-xs uppercase tracking-wider shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo hábito
          </Link>
        </div>
      </div>

      {/* BLOCO SUPERIOR EXECUTIVO */}
      {activeHabit && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C531E]">
                  Estratégia em Foco
                </span>
                <h3 className="font-serif-title text-2xl font-semibold text-[#1E1713] mt-1">
                  {activeHabit.titulo}
                </h3>
                <p className="text-xs text-[#7A6F64] mt-0.5">{activeHabit.objetivo}</p>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <Link
                href={`/habitos/${activeHabit.id}`}
                className="text-xs font-semibold text-[#AF6A28] hover:text-[#975A22] flex items-center gap-1 transition"
              >
                Abrir detalhes da estratégia
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#E4DED4] p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#AF6A28] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Dica para começar
              </span>
              <p className="text-xs text-[#5E544A] leading-relaxed">
                Se estiver difícil começar, experimente reduzir a atividade a um primeiro passo pequeno.
              </p>
              <Link
                href={`/habitos/${activeHabit.id}`}
                className="inline-block text-[11px] font-semibold text-[#AF6A28] hover:underline pt-1"
              >
                Ver feedbacks →
              </Link>
            </div>

            <div className="bg-[#FAF8F5] rounded-2xl border border-[#E4DED4] p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7A6F64]">
                Próximo passo recomendado
              </span>
              <p className="text-xs text-[#5E544A] leading-relaxed">
                Testar a estratégia na sua rotina hoje e registrar seu feedback sincero de aplicação.
              </p>
              <Link
                href={`/habitos/${activeHabit.id}`}
                className="inline-block text-[11px] font-semibold text-[#AF6A28] hover:underline pt-1"
              >
                Registrar tentativa →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: MEUS HÁBITOS */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-title text-2xl font-normal text-[#1E1713]">
              Meus hábitos ({habitos.length})
            </h2>
            <p className="text-xs text-[#7A6F64]">
              Acompanhe seus hábitos fundamentados em evidências.
            </p>
          </div>

          {/* Filtros em Pílulas */}
          <div className="flex items-center gap-1.5 bg-[#EFE9DF] p-1 rounded-xl border border-[#E1D8CB]">
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'todos'
                  ? 'bg-[#FAF8F5] text-[#1E1713] shadow-2xs'
                  : 'text-[#7A6F64] hover:text-[#1E1713]'
              }`}
            >
              Todos ({habitos.length})
            </button>
            <button
              onClick={() => setFilter('ativos')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'ativos'
                  ? 'bg-[#FAF8F5] text-[#1E1713] shadow-2xs'
                  : 'text-[#7A6F64] hover:text-[#1E1713]'
              }`}
            >
              Ativos ({habitos.filter((h) => h.status === 'ativo').length})
            </button>
            <button
              onClick={() => setFilter('pausados')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'pausados'
                  ? 'bg-[#FAF8F5] text-[#1E1713] shadow-2xs'
                  : 'text-[#7A6F64] hover:text-[#1E1713]'
              }`}
            >
              Pausados ({habitos.filter((h) => h.status === 'pausado').length})
            </button>
          </div>
        </div>

        {error && (
          <div className="p-8 bg-[#FAF8F5] rounded-3xl border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-serif-title text-lg text-[#1E1713]">{error}</h3>
            <button
              onClick={fetchHabitos}
              className="px-4 py-2 rounded-lg bg-[#AF6A28] text-white text-xs font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {habitos.length === 0 && !loading && !error && (
          <div className="p-16 rounded-3xl border-2 border-dashed border-[#DCD3C5] bg-[#FAF8F5] text-center space-y-4">
            <Inbox className="w-10 h-10 text-[#A89D91] mx-auto" />
            <h3 className="font-serif-title text-xl text-[#1E1713]">
              Você ainda não possui hábitos cadastrados
            </h3>
            <p className="text-xs text-[#7A6F64] max-w-sm mx-auto">
              Cadastre um hábito, responda às perguntas sobre sua rotina e receba uma sugestão criada por regras locais.
            </p>
            <Link
              href="/habitos/novo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#AF6A28] text-white text-xs uppercase tracking-wider font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar meu primeiro hábito
            </Link>
          </div>
        )}

        {filteredHabits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onDelete={handleDeleteHabit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
