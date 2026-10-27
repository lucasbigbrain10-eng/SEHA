'use client';

import { Loader2, AlertCircle } from 'lucide-react';

interface OperationStatusProps {
  message?: string;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function OperationStatus({
  message = 'Processando…',
  isError = false,
  errorMessage = 'Não foi possível concluir a operação. Tente novamente.',
  onRetry,
}: OperationStatusProps) {
  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-rose-900">Erro na operação</p>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
        {onRetry && <button onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700">Tentar novamente</button>}
      </div>
    );
  }

  return (
    <div role="status" className="rounded-2xl border border-[#DDCBBA] bg-[#F7EFE4] p-4 flex items-center gap-3.5">
      <Loader2 className="w-5 h-5 animate-spin text-[#AF6A28] shrink-0" />
      <span className="text-xs font-medium text-[#42362A]">{message}</span>
    </div>
  );
}
