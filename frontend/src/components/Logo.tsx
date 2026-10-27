'use client';

import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function Logo({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
}: LogoProps) {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Símbolo Bússola Geométrica Minimalista */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Círculo externo fino */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke={isDark ? '#F4EFE6' : '#AF6A28'}
            strokeWidth="2.5"
            strokeDasharray="1 0"
          />
          {/* Círculo interno sutil */}
          <circle
            cx="50"
            cy="50"
            r="16"
            stroke={isDark ? '#D9CFBF' : '#C78C4E'}
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          {/* Linhas ortogonais que transpassam o círculo */}
          <line
            x1="50"
            y1="4"
            x2="50"
            y2="96"
            stroke={isDark ? '#F4EFE6' : '#AF6A28'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="50"
            x2="96"
            y2="50"
            stroke={isDark ? '#F4EFE6' : '#AF6A28'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Pontas da estrela direcional (Norte, Sul, Leste, Oeste) */}
          <polygon
            points="50,14 53,44 50,47 47,44"
            fill={isDark ? '#F4EFE6' : '#AF6A28'}
          />
          <polygon
            points="50,86 53,56 50,53 47,56"
            fill={isDark ? '#F4EFE6' : '#AF6A28'}
          />
          <polygon
            points="14,50 44,47 47,50 44,53"
            fill={isDark ? '#F4EFE6' : '#AF6A28'}
          />
          <polygon
            points="86,50 56,47 53,50 56,53"
            fill={isDark ? '#F4EFE6' : '#AF6A28'}
          />
          {/* Ponto central */}
          <circle cx="50" cy="50" r="3.5" fill={isDark ? '#F4EFE6' : '#AF6A28'} />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`font-serif-title font-semibold tracking-wider ${titleSizes[size]} ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#1E1713]'
          }`}
        >
          SEH.IA
        </span>
        {showSubtitle && (
          <span
            className={`font-sans tracking-widest uppercase mt-0.5 ${subSizes[size]} ${
              isDark ? 'text-[#C9BFB0]' : 'text-[#877C70]'
            }`}
          >
            Engenharia de Hábitos
          </span>
        )}
      </div>
    </div>
  );
}
