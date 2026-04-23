'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Truck,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDateShort, formatConcepto } from '@/lib/formatters';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import {
  getResumenCuentas,
  getAlertasStock,
  getUltimosMovimientos,
  getCuentasCorrientes,
  getClientes,
  getProveedores,
} from '@/lib/firebase-db';
import type {
  ResumenCuentas,
  AlertaStock,
  Movimiento,
  CuentaCorriente,
  TipoEntidad,
} from '@/types';
import { cn } from '@/lib/utils';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<CuentaConEntidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resumenData, alertasData, movimientosData, cuentasData, clientes, proveedores] =
          await Promise.all([
            getResumenCuentas(),
            getAlertasStock(),
            getUltimosMovimientos(8),
            getCuentasCorrientes(),
            getClientes(),
            getProveedores(),
          ]);

        setResumen(resumenData);
        setAlertas(alertasData);
        setMovimientos(movimientosData);

        const cuentasEnriched: CuentaConEntidad[] = cuentasData.map((c) => {
          let entidadNombre = 'N/A';
          if (c.tipoEntidad === 'cliente') {
            entidadNombre =
              clientes.find((cli) => cli.id === c.entidadId)?.razonSocial || 'Desconocido';
          } else {
            entidadNombre =
              proveedores.find((p) => p.id === c.entidadId)?.razonSocial || 'Desconocido';
          }
          return { ...c, entidadNombre };
        });
        setCuentas(cuentasEnriched);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const cuentaPorId = useMemo(() => {
    const map = new Map<string, CuentaConEntidad>();
    cuentas.forEach((c) => map.set(c.id, c));
    return map;
  }, [cuentas]);

  const topProveedores = useMemo(
    () =>
      cuentas
        .filter((c) => c.tipoEntidad === 'proveedor' && c.saldoActual > 0)
        .sort((a, b) => b.saldoActual - a.saldoActual)
        .slice(0, 5),
    [cuentas],
  );

  const topClientes = useMemo(
    () =>
      cuentas
        .filter((c) => c.tipoEntidad === 'cliente' && c.saldoActual > 0)
        .sort((a, b) => b.saldoActual - a.saldoActual)
        .slice(0, 5),
    [cuentas],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Resumen general
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Hola 👋</h1>
          <p className="text-sm text-muted-foreground">
            Estado de tus cuentas corrientes al día de hoy.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/cuentas">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total a cobrar"
          value={formatCurrency(resumen?.totalCobrar || 0)}
          sub={`${resumen?.cantidadClientesDeudores || 0} clientes con saldo`}
          tone="positive"
          icon={<ArrowDownCircle className="h-5 w-5" />}
          href="/cuentas"
        />
        <KpiCard
          label="Total a pagar"
          value={formatCurrency(resumen?.totalPagar || 0)}
          sub={`${resumen?.cantidadProveedoresAcreedores || 0} proveedores`}
          tone="negative"
          icon={<ArrowUpCircle className="h-5 w-5" />}
          href="/cuentas"
        />
        <KpiCard
          label="Balance neto"
          value={formatCurrency(
            (resumen?.totalCobrar || 0) - (resumen?.totalPagar || 0),
          )}
          sub="Cobrar − pagar"
          tone={
            (resumen?.totalCobrar || 0) - (resumen?.totalPagar || 0) >= 0
              ? 'positive'
              : 'negative'
          }
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          label="Alertas de stock"
          value={`${alertas.length}`}
          sub="productos bajo mínimo"
          tone={alertas.length > 0 ? 'warning' : 'neutral'}
          icon={<AlertTriangle className="h-5 w-5" />}
          href="/productos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Últimos movimientos</CardTitle>
              <p className="text-xs text-muted-foreground">Actividad reciente en cuentas</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cuentas">
                Ver todo
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {movimientos.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title="Sin movimientos"
                description="Registrá el primer movimiento desde una cuenta."
              />
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-md border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Entidad</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.map((mov) => {
                        const cuenta = cuentaPorId.get(mov.cuentaId);
                        const tipoEntidad: TipoEntidad = cuenta?.tipoEntidad || 'cliente';
                        const effect = tipoEntidad === 'cliente'
                          ? mov.tipo === 'debe' ? 'aumenta' : 'disminuye'
                          : mov.tipo === 'haber' ? 'aumenta' : 'disminuye';
                        return (
                          <TableRow key={mov.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateShort(mov.fecha)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {tipoEntidad === 'proveedor' ? (
                                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">
                                  {cuenta?.entidadNombre || '—'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {formatConcepto(mov.concepto)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  'inline-flex items-center justify-end gap-1 text-sm font-semibold tabular-nums',
                                  effect === 'aumenta' ? 'text-rose-600' : 'text-emerald-600',
                                )}
                              >
                                {effect === 'aumenta' ? (
                                  <ArrowUpCircle className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowDownCircle className="h-3.5 w-3.5" />
                                )}
                                {formatCurrency(mov.monto)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <ul className="flex flex-col gap-2 md:hidden">
                  {movimientos.map((mov) => {
                    const cuenta = cuentaPorId.get(mov.cuentaId);
                    const tipoEntidad: TipoEntidad = cuenta?.tipoEntidad || 'cliente';
                    const effect = tipoEntidad === 'cliente'
                      ? mov.tipo === 'debe' ? 'aumenta' : 'disminuye'
                      : mov.tipo === 'haber' ? 'aumenta' : 'disminuye';
                    return (
                      <li
                        key={mov.id}
                        className="rounded-md border bg-card p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {tipoEntidad === 'proveedor' ? (
                                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="truncate text-sm font-medium">
                                {cuenta?.entidadNombre || '—'}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="font-normal">
                                {formatConcepto(mov.concepto)}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateShort(mov.fecha)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums',
                              effect === 'aumenta' ? 'text-rose-600' : 'text-emerald-600',
                            )}
                          >
                            {effect === 'aumenta' ? (
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownCircle className="h-3.5 w-3.5" />
                            )}
                            {formatCurrency(mov.monto)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TopCuentasCard
            title="Top a pagar"
            icon={<Truck className="h-4 w-4" />}
            items={topProveedores}
            tipo="proveedor"
            emptyLabel="Sin saldos pendientes con proveedores."
          />
          <TopCuentasCard
            title="Top a cobrar"
            icon={<Users className="h-4 w-4" />}
            items={topClientes}
            tipo="cliente"
            emptyLabel="Sin saldos pendientes de clientes."
          />
        </div>
      </div>

      {alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertas de stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alertas.slice(0, 6).map((a) => (
                <Link
                  key={a.productoId}
                  href={`/productos/${a.productoId}/editar`}
                  className="flex items-center justify-between rounded-md border p-3 transition hover:border-primary/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.productoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {a.stockMinimo}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="tabular-nums">
                    {a.stockActual}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: React.ReactNode;
  href?: string;
}) {
  const toneStyle = {
    positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    negative: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    neutral: 'bg-muted text-foreground',
  }[tone];

  const inner = (
    <CardContent className="flex items-center gap-4 py-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toneStyle}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xl font-bold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </CardContent>
  );

  return (
    <Card className={href ? 'transition hover:border-primary/60 hover:shadow-sm' : undefined}>
      {href ? <Link href={href}>{inner}</Link> : inner}
    </Card>
  );
}

function TopCuentasCard({
  title,
  icon,
  items,
  tipo,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: CuentaConEntidad[];
  tipo: TipoEntidad;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-1">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${c.entidadId}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 transition hover:bg-muted"
                >
                  <span className="truncate text-sm font-medium">{c.entidadNombre}</span>
                  <BalanceDisplay
                    saldo={c.saldoActual}
                    tipoEntidad={tipo}
                    size="sm"
                    showLabel={false}
                    align="right"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
