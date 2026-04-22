'use client';

import { Banknote, CreditCard, FileText, Landmark, Wallet } from 'lucide-react';
import { MedioPago } from '@/types';
import { cn } from '@/lib/utils';

interface MedioOption {
  value: MedioPago;
  label: string;
  description: string;
  icon: typeof Banknote;
}

const options: MedioOption[] = [
  {
    value: 'efectivo',
    label: 'Efectivo',
    description: 'Cobro inmediato, no afecta saldo',
    icon: Banknote,
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
    description: 'Cobro inmediato, no afecta saldo',
    icon: Landmark,
  },
  {
    value: 'tarjeta',
    label: 'Tarjeta',
    description: 'Cobro inmediato, no afecta saldo',
    icon: CreditCard,
  },
  {
    value: 'cheque',
    label: 'Cheque',
    description: 'Cobro inmediato, no afecta saldo',
    icon: FileText,
  },
  {
    value: 'cuenta_corriente',
    label: 'Cuenta corriente',
    description: 'Se carga al cliente como deuda',
    icon: Wallet,
  },
];

interface MediosPagoSelectorProps {
  value: MedioPago | null;
  onChange: (medio: MedioPago) => void;
}

export function MediosPagoSelector({ value, onChange }: MediosPagoSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        const Icon = opt.icon;
        const isCtaCte = opt.value === 'cuenta_corriente';

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-lg border bg-card p-3 text-left transition-all',
              selected
                ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                : 'border-border hover:border-primary/40 hover:bg-accent',
              isCtaCte && 'col-span-2',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : isCtaCte
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
