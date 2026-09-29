import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type KpiTone = 'positive' | 'negative' | 'neutral' | 'warning';

const tonos: Record<KpiTone, string> = {
  positive: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  negative: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: KpiTone;
  icon: LucideIcon;
  href?: string;
}

/**
 * La tarjeta de métrica del dashboard. Estaba duplicada en tres pantallas con
 * variantes ligeramente distintas; se unificó acá al agregar la cuarta.
 */
export function KpiCard({ label, value, sub, tone = 'neutral', icon: Icon, href }: KpiCardProps) {
  const contenido = (
    <Card className={cn(href && 'transition-colors hover:bg-muted/40')}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tonos[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-xl font-semibold">{value}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{contenido}</Link> : contenido;
}
