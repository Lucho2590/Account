'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Venta } from '@/types';
import { getVentas } from '@/lib/firebase-db';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VentasTable } from '@/components/ventas/ventas-table';
import {
  Loader2,
  Plus,
  ShoppingCart,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getVentas();
        if (!cancelled) setVentas(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    let ventasMes = 0;
    let facturacionMes = 0;
    let pendienteCobro = 0;
    let anuladas = 0;

    ventas.forEach((v) => {
      const f = new Date(v.fecha);
      const enMes = f.getMonth() === mesActual && f.getFullYear() === anioActual;

      if (v.estado === 'anulada') {
        anuladas++;
        return;
      }
      if (enMes) {
        ventasMes++;
        facturacionMes += v.total;
      }
      if (v.medioPago === 'cuenta_corriente') {
        pendienteCobro += v.total;
      }
    });

    return { ventasMes, facturacionMes, pendienteCobro, anuladas };
  }, [ventas]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Registrá operaciones de venta con stock, cobro y cuenta corriente
          </p>
        </div>
        <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
          <Link href="/ventas/nueva">
            <Plus className="h-4 w-4" />
            Nueva venta
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas del mes"
          value={String(kpis.ventasMes)}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="neutral"
        />
        <KpiCard
          label="Facturación del mes"
          value={formatCurrency(kpis.facturacionMes)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="positive"
        />
        <KpiCard
          label="Pendiente de cobro"
          value={formatCurrency(kpis.pendienteCobro)}
          icon={<Wallet className="h-5 w-5" />}
          tone="warning"
          sub="Ventas en cuenta corriente"
        />
        <KpiCard
          label="Anuladas"
          value={String(kpis.anuladas)}
          icon={<XCircle className="h-5 w-5" />}
          tone="negative"
        />
      </div>

      <VentasTable ventas={ventas} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
  sub?: string;
}) {
  const toneStyle =
    tone === 'positive'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : tone === 'negative'
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
        : tone === 'warning'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          : 'bg-muted text-foreground';

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneStyle}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-xl font-bold tabular-nums">{value}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
