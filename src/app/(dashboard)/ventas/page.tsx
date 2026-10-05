'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Venta } from '@/types';
import { getVentas } from '@/lib/firebase-db';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { VentasTable } from '@/components/ventas/ventas-table';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  Loader2,
  Plus,
  ShoppingCart,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useEmpresaId } from '@/contexts/AuthContext';

export default function VentasPage() {
  const empresaId = useEmpresaId();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getVentas(empresaId);
        if (!cancelled) setVentas(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [empresaId]);

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
          icon={ShoppingCart}
          tone="neutral"
        />
        <KpiCard
          label="Facturación del mes"
          value={formatCurrency(kpis.facturacionMes)}
          icon={TrendingUp}
          tone="positive"
        />
        <KpiCard
          label="Pendiente de cobro"
          value={formatCurrency(kpis.pendienteCobro)}
          icon={Wallet}
          tone="warning"
          sub="Ventas en cuenta corriente"
        />
        <KpiCard
          label="Anuladas"
          value={String(kpis.anuladas)}
          icon={XCircle}
          tone="negative"
        />
      </div>

      <VentasTable ventas={ventas} />
    </div>
  );
}
