'use client';

import { ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, getSaldoEstado, formatSaldoEstado } from '@/lib/formatters';
import type { TipoEntidad } from '@/types';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface BalanceDisplayProps {
  saldo: number;
  tipoEntidad: TipoEntidad;
  size?: Size;
  showLabel?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

const sizeMap: Record<Size, { amount: string; label: string; icon: string }> = {
  sm: { amount: 'text-sm font-semibold', label: 'text-xs', icon: 'h-3 w-3' },
  md: { amount: 'text-base font-semibold', label: 'text-xs', icon: 'h-4 w-4' },
  lg: { amount: 'text-2xl font-bold tracking-tight', label: 'text-xs uppercase tracking-wider', icon: 'h-5 w-5' },
  xl: { amount: 'text-3xl font-bold tracking-tight', label: 'text-xs uppercase tracking-wider', icon: 'h-6 w-6' },
};

export function BalanceDisplay({
  saldo,
  tipoEntidad,
  size = 'md',
  showLabel = true,
  align = 'left',
  className,
}: BalanceDisplayProps) {
  const estado = getSaldoEstado(saldo, tipoEntidad);
  const s = sizeMap[size];

  const color =
    estado === 'al_dia'
      ? 'text-muted-foreground'
      : estado === 'a_cobrar'
        ? 'text-emerald-600 dark:text-emerald-400'
        : estado === 'a_pagar'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-amber-600 dark:text-amber-400';

  const Icon =
    estado === 'al_dia'
      ? CheckCircle2
      : estado === 'a_cobrar'
        ? ArrowDownCircle
        : ArrowUpCircle;

  const absoluteSaldo = Math.abs(saldo);

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5',
        align === 'right' && 'items-end text-right',
        className,
      )}
    >
      {showLabel && (
        <span className={cn('text-muted-foreground', s.label)}>
          {formatSaldoEstado(estado)}
        </span>
      )}
      <span className={cn('inline-flex items-center gap-1.5 tabular-nums', color, s.amount)}>
        {size !== 'sm' && <Icon className={s.icon} aria-hidden />}
        {formatCurrency(absoluteSaldo)}
      </span>
    </div>
  );
}
