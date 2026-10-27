'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CadastroPage() {
  const { register } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }
    if (!email.includes('@')) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(nome, email, senha);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-serif-title text-3xl sm:text-4xl font-normal text-[#1E1713]">
              Criar Conta
            </h1>
            <p className="text-xs text-[#70665D]">
              Cadastre-se para registrar hábitos e organizar passos práticos para sua rotina.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conta criada com sucesso! Redirecionando...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                disabled={loading || success}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#DDD5C7] bg-white text-[#1E1713] focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition placeholder:text-[#A89D91]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6158] mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                disabled={loading || success}
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
                placeholder="Mínimo 6 caracteres"
                disabled={loading || success}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#DDD5C7] bg-white text-[#1E1713] focus:border-[#AF6A28] focus:ring-1 focus:ring-[#AF6A28] outline-none transition placeholder:text-[#A89D91]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 rounded-xl bg-[#AF6A28] hover:bg-[#975A22] text-white font-medium text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#70665D]">
            Já possui uma conta?{' '}
            <Link href="/login" className="font-semibold text-[#AF6A28] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>

        {/* Lado Direito: Frase Editorial */}
        <div className="lg:col-span-5 bg-[#F0EBE1] border-t lg:border-t-0 lg:border-l border-[#E4DED4] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-xs">
            <div className="w-12 h-12 mx-auto rounded-full border border-[#D0C5B4] flex items-center justify-center text-[#AF6A28]">
              <span className="text-xl">✧</span>
            </div>
            <p className="font-serif-title italic text-2xl text-[#3D332A] leading-relaxed">
              &ldquo;Pequenos ajustes, grandes mudanças.&rdquo;
            </p>
            <div className="h-px w-12 bg-[#AF6A28] mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
