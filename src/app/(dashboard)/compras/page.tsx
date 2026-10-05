'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { OrdenCompra } from '@/types';
import { getOrdenesCompra } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/kpi-card';
import { OrdenesTable } from '@/components/compras/ordenes-table';
import { toast } from 'sonner';
import { Clock, Loader2, PackagePlus, Plus, TrendingDown, Wallet } from 'lucide-react';

export default function ComprasPage() {
  const empresaId = useEmpresaId();
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const data = await getOrdenesCompra(empresaId);
        if (!cancelado) setOrdenes(data);
      } catch (error) {
        console.error('Error loading compras:', error);
        if (!cancelado) toast.error('Error al cargar las compras');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  const kpis = useMemo(() => {
    const ahora = new Date();
    let comprasMes = 0;
    let montoMes = 0;
    let pendientes = 0;
    let porRecibir = 0;

    ordenes.forEach((o) => {
      if (o.estado === 'anulada') return;
      const f = new Date(o.fecha);
      if (f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()) {
        comprasMes++;
        montoMes += o.total;
      }
      if (o.estado === 'pendiente' || o.estado === 'parcial') {
        pendientes++;
        porRecibir += o.items.reduce(
          (s, it) => s + (it.cantidad - it.cantidadRecibida) * it.costoUnitario,
          0,
        );
      }
    });

    return { comprasMes, montoMes, pendientes, porRecibir };
  }, [ordenes]);

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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Compras</h1>
          <p className="text-sm text-muted-foreground">
            Pedidos a proveedores, recepción de mercadería y control de costos
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/compras/directa">
              <PackagePlus className="h-4 w-4" />
              Compra directa
            </Link>
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/compras/nueva">
              <Plus className="h-4 w-4" />
              Nueva orden
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Compras del mes" value={kpis.comprasMes} icon={PackagePlus} />
        <KpiCard
          label="Monto del mes"
          value={formatCurrency(kpis.montoMes)}
          icon={TrendingDown}
          tone="neutral"
        />
        <KpiCard
          label="Órdenes abiertas"
          value={kpis.pendientes}
          sub="Pendientes o recibidas en parte"
          icon={Clock}
          tone={kpis.pendientes > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Por recibir"
          value={formatCurrency(kpis.porRecibir)}
          sub="Mercadería pedida sin entregar"
          icon={Wallet}
          tone="neutral"
        />
      </div>

      <OrdenesTable ordenes={ordenes} />
    </div>
  );
}
