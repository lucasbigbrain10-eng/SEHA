'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import StudyModal, { Study } from '@/components/StudyModal';

const ESTUDOS_COMPORTAMENTO: Study[] = [
  {
    id: 'gollwitzer-1999',
    titulo: 'Implementação de Intenções: A Força de Planos "Se... Então..."',
    autor: 'Dr. Peter M. Gollwitzer (Universidade de Nova York / Konstanz)',
    ano: '1999',
    veiculo: 'American Psychologist, 54(7), 493–503',
    previa: 'Artigo de revisão que descreve planos que vinculam uma situação prevista a uma resposta definida pelo próprio indivíduo.',
    metodologia: 'Artigo publicado em American Psychologist, 54(7), páginas 493–503, em 1999. Não apresentamos aqui uma taxa de eficácia.',
    descobertas: [
      'O artigo discute planos no formato situação–resposta, também chamados de implementation intentions.',
      'O trabalho apresenta uma revisão de pesquisas sobre como planos específicos podem apoiar a passagem de intenção para ação.',
      'O resultado individual depende do contexto; a referência não permite garantir que um plano funcione para todas as pessoas.'
    ],
    comoSehaAplica: 'O fluxo pede um período, dificuldades e uma alternativa. Regras determinísticas combinam essas respostas para montar uma sugestão editável.',
    fonteUrl: 'https://doi.org/10.1037/0003-066X.54.7.493',
  },
  {
    id: 'fogg-2019',
    titulo: 'O Modelo Comportamental de Fogg (B = MAP) e Tiny Habits',
    autor: 'Dr. BJ Fogg (Fundador do Stanford Behavior Design Lab)',
    ano: '2019',
    veiculo: 'Stanford University & Houghton Mifflin Harcourt',
    previa: 'Um comportamento só acontece quando Motivação (M), Habilidade (A) e Gatilho (P) convergem no mesmo instante. Se a motivação cair, a habilidade deve ser simplificada ao extremo.',
    metodologia: 'Livro de divulgação sobre design de comportamento publicado em 2019; não é apresentado como estudo clínico nem como teste do SEHA.',
    descobertas: [
      'O livro apresenta um modelo que relaciona motivação, habilidade e gatilho para descrever comportamentos.',
      'A proposta de começar com uma ação pequena é uma ideia prática descrita pelo autor, não uma garantia de resultado.',
      'O SEHA oferece alternativas locais simples e deixa o usuário revisar o passo sugerido.'
    ],
    comoSehaAplica: 'A sugestão usa o primeiro passo selecionado. O usuário pode registrar outra meta mínima nas próprias anotações, sem duração obrigatória.',
    fonteUrl: 'https://www.penguin.co.uk/books/438937/tiny-habits-by-bj-fogg/9780753554890',
  },
  {
    id: 'clear-2018',
    titulo: 'Atomic Habits: contexto e mudanças de ambiente',
    autor: 'James Clear',
    ano: '2018',
    veiculo: 'Avery Publishing',
    previa: 'Livro de divulgação que discute estratégias práticas, entre elas a organização do ambiente para facilitar comportamentos desejados.',
    metodologia: 'Livro publicado em 2018. Não é um ensaio clínico nem uma validação independente das regras implementadas no SEHA.',
    descobertas: [
      'A obra reúne orientações práticas sobre pistas, repetição e ambiente.',
      'As ideias são apresentadas como sugestões para experimentação individual, sem taxas de eficácia neste aplicativo.',
      'A tela do hábito oferece um campo para o usuário registrar suas próprias mudanças de ambiente.'
    ],
    comoSehaAplica: 'As regras locais podem sugerir preparar materiais com antecedência; o usuário registra outras mudanças de ambiente nas anotações.',
    fonteUrl: 'https://www.penguinrandomhouse.com/books/543993/atomic-habits-by-james-clear/9780735211292/',
  },
  {
    id: 'deci-ryan',
    titulo: 'The “What” and “Why” of Goal Pursuits',
    autor: 'Drs. Edward L. Deci & Richard M. Ryan (Universidade de Rochester)',
    ano: '2000',
    veiculo: 'Psychological Inquiry, 11(4), 227–268',
    previa: 'Artigo teórico que discute necessidades psicológicas de autonomia, competência e relacionamento na teoria da autodeterminação.',
    metodologia: 'Artigo teórico de 2000; não é um ensaio sobre streaks nem uma avaliação do SEHA.',
    descobertas: [
      'Os autores discutem autonomia, competência e relacionamento como necessidades psicológicas relevantes à motivação.',
      'O artigo diferencia formas de motivação e como contextos podem apoiá-las ou dificultá-las.',
      'O SEHA não mede essas necessidades nem infere a motivação do usuário.'
    ],
    comoSehaAplica: 'O usuário decide se aplica, recusa ou modifica uma sugestão local de ajuste; o sistema não atribui a dificuldade à falta de disciplina.',
    fonteUrl: 'https://doi.org/10.1207/S15327965PLI1104_01',
  }
];

export default function HomePage() {
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* SEÇÃO 1: HERO PRINCIPAL CLARO */}
      <section className="relative px-6 sm:px-12 lg:px-20 pt-16 pb-20 border-b border-[#E4DED4] overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#AF6A28]">
                Comportamento humano e regras locais
              </span>
              <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-[64px] leading-[1.08] font-normal text-[#1E1713] tracking-tight">
                Engenharia de Hábitos baseada em evidências.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#61574E] max-w-xl leading-relaxed font-normal">
              Organize hábitos, registre seu contexto e receba sugestões práticas geradas por regras locais explícitas.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/cadastro"
                className="px-7 py-3.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white font-medium text-xs uppercase tracking-wider shadow-sm transition flex items-center gap-2"
              >
                Criar conta
              </Link>
              <Link
                href="/login"
                className="px-7 py-3.5 rounded-lg border border-[#D5CCC0] bg-[#FAF8F4] text-[#1E1713] hover:bg-white font-medium text-xs uppercase tracking-wider transition"
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex items-center justify-center py-6">
            <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#D8CEBF]/80"></div>
              <div className="absolute inset-8 rounded-full border border-[#D8CEBF]/60"></div>
              <div className="absolute inset-16 rounded-full border border-[#C58B53]/40"></div>
              <div className="absolute inset-24 rounded-full border border-[#AF6A28]/50"></div>
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#D8CEBF]"></div>
              <div className="absolute inset-y-0 left-1/2 w-px bg-[#D8CEBF]"></div>
              <div className="w-5 h-5 rounded-full bg-[#AF6A28] shadow-sm flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>

            <div className="absolute right-0 top-6 hidden sm:flex flex-col gap-3 text-[10px] tracking-[0.25em] uppercase text-[#8A7E72] font-semibold border-l border-[#D8CEBF] pl-4">
              <span>Ciência</span>
              <span>Estratégia</span>
              <span>Pessoas</span>
              <span>Resultados</span>
            </div>
          </div>
        </div>

        {/* Três Pilares Inferiores */}
        <div className="max-w-7xl mx-auto pt-16 mt-8 border-t border-[#E4DED4]/80 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-full bg-[#EAE2D5] text-[#AF6A28] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-serif-title font-semibold text-base text-[#1E1713]">Regras claras</h4>
              <p className="text-xs text-[#6B6158] mt-1 leading-relaxed">
                As sugestões seguem condições locais e consideram as respostas registradas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-full bg-[#EAE2D5] text-[#AF6A28] flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-serif-title font-semibold text-base text-[#1E1713]">Ajustes práticos</h4>
              <p className="text-xs text-[#6B6158] mt-1 leading-relaxed">
                Revise sugestões e anotações conforme sua experiência.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-full bg-[#EAE2D5] text-[#AF6A28] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-serif-title font-semibold text-base text-[#1E1713]">Privacidade estrita</h4>
              <p className="text-xs text-[#6B6158] mt-1 leading-relaxed">
                Seus dados, rotinas e contextos pertencem unicamente a você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: NOVA SEÇÃO - BASE CIENTÍFICA & ESTUDOS DE COMPORTAMENTO */}
      <section className="px-6 sm:px-12 lg:px-20 py-20 bg-[#F2ECE2] border-b border-[#E4DED4]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#D8CEBF] pb-6">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#AF6A28]">
                Referências conceituais
              </span>
              <h2 className="font-serif-title text-3xl sm:text-4xl text-[#1E1713] font-normal">
                Leituras sobre hábitos e comportamento
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6F64] max-w-xl">
                Estas publicações inspiram algumas escolhas da interface. Elas não validam as regras do aplicativo nem garantem resultados individuais.
              </p>
            </div>
            <div className="text-xs text-[#8A7E72] italic">
              Fontes identificadas
            </div>
          </div>

          {/* Grade de Estudos com Prévia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ESTUDOS_COMPORTAMENTO.map((estudo) => (
              <div
                key={estudo.id}
                className="bg-[#FAF8F5] rounded-3xl border border-[#E4DED4] p-7 flex flex-col justify-between space-y-5 hover:border-[#AF6A28] transition duration-200 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[10px] tracking-wider uppercase font-semibold text-[#AF6A28]">
                    <span>{estudo.veiculo}</span>
                    <span className="text-[#8C8074]">{estudo.ano}</span>
                  </div>

                  <h3 className="font-serif-title text-xl font-semibold text-[#1E1713] leading-snug">
                    {estudo.titulo}
                  </h3>

                  <p className="text-xs text-[#7A6F64] italic">
                    {estudo.autor}
                  </p>

                  <div className="pt-2 border-t border-[#EAE3D6] text-xs text-[#4F4439] leading-relaxed">
                    <strong className="text-[#1E1713] font-semibold block mb-1">Sobre a publicação:</strong>
                    {estudo.previa}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#EAE3D6]">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C8074]">
                    Detalhes da referência
                  </span>
                  <button
                    onClick={() => setSelectedStudy(estudo)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#DDD5C7] text-[#1E1713] hover:bg-[#EAE2D4] hover:border-[#AF6A28] text-xs font-semibold uppercase tracking-wider transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#AF6A28]" />
                    Ver referência
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SEÇÃO 3: HERO ESCURO / EDITORIAL */}
      <section className="bg-[#1A130E] text-[#F5F1E9] px-6 sm:px-12 lg:px-20 py-20 border-b border-[#2C221A]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif-title text-3xl sm:text-5xl font-normal leading-tight text-[#FAF7F2]">
              Mais que hábitos.
              <br />
              Um sistema para você evoluir.
            </h2>
            <p className="text-sm sm:text-base text-[#C2B7A8] max-w-xl leading-relaxed">
              O <strong className="text-white font-semibold">SEHA</strong> ajuda a organizar hábitos, contexto e próximos passos usando regras locais transparentes.
            </p>

            <div className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border border-[#524438] flex items-center justify-center text-[#D69654]">
                <Compass className="w-5 h-5" />
              </div>
              <div className="text-xs tracking-widest uppercase text-[#A89C8E]">
                <span className="block font-semibold text-white">Seu Contexto + Nossas Estratégias</span>
                <span className="text-[#C58B53]">= Próximos passos claros</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center items-start lg:items-end">
            <div className="border-l lg:border-l-0 lg:border-r border-[#4A3C30] pl-6 lg:pl-0 lg:pr-6 space-y-4 py-2">
              <span className="block text-xs font-semibold tracking-[0.3em] uppercase text-[#D69654]">
                Observar
              </span>
              <span className="block text-xs font-semibold tracking-[0.3em] uppercase text-[#A89C8E]">
                Analisar
              </span>
              <span className="block text-xs font-semibold tracking-[0.3em] uppercase text-[#C2B7A8]">
                Experimentar
              </span>
              <span className="block text-xs font-semibold tracking-[0.3em] uppercase text-[#FAF7F2]">
                Evoluir
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 bg-[#F6F3EC] text-center text-xs text-[#877C70] border-t border-[#E4DED4]">
        <p>© 2026 SEHA — Engenharia de Hábitos. Todos os direitos reservados.</p>
      </footer>

      {/* Modal de Estudo Completo */}
      <StudyModal
        study={selectedStudy}
        isOpen={!!selectedStudy}
        onClose={() => setSelectedStudy(null)}
      />
    </div>
  );
}
