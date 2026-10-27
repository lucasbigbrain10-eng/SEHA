'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !senha.trim()) {
      setError('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        
        {/* Lado Esquerdo: Bloco Escuro Editorial */}
        <div className="lg:col-span-5 bg-[#1A130E] p-8 sm:p-12 flex flex-col justify-between text-[#F5F1E9] relative">
          <div className="w-10 h-10 rounded-full border border-[#47382D] flex items-center justify-center text-[#D69654]">
            <Compass className="w-5 h-5" />
          </div>

          <div className="space-y-4 my-8">
            <p className="font-serif-title italic text-2xl sm:text-3xl text-[#FAF7F2] leading-snug">
              &ldquo;Grandes mudanças começam com pequenos passos.&rdquo;
            </p>
            <div className="h-0.5 w-12 bg-[#AF6A28]"></div>
          </div>

          <div className="text-[11px] tracking-widest uppercase text-[#8F8174]">
            SEH.IA • Engenharia de Hábitos
          </div>
        </div>

        {/* Lado Direito: Formulário de Acesso */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-serif-title text-3xl sm:text-4xl font-normal text-[#1E1713]">
              Acessar Conta
            </h1>
            <p className="text-xs text-[#70665D]">
              Informe suas credenciais para visualizar e gerenciar seus hábitos.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                disabled={loading}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#DDD5C7] bg-white text-[#1E1713] focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition placeholder:text-[#A89D91]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                disabled={loading}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#DDD5C7] bg-white text-[#1E1713] focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition placeholder:text-[#A89D91]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#AF6A28] hover:bg-[#975A22] text-white font-medium text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#70665D]">
            Não possui uma conta?{' '}
            <Link href="/cadastro" className="font-semibold text-[#AF6A28] hover:underline">
              Cadastrar-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
