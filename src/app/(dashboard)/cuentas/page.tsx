'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Cliente, CuentaCorriente, Movimiento, Proveedor } from '@/types';
import {
  getCuentasCorrientes,
  getClientes,
  getProveedores,
  getUltimosMovimientos,
  getMovimientosByCuenta,
} from '@/lib/firebase-db';
import { generateEstadoCuentaPDF } from '@/lib/pdf-generator';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  Plus,
  Search,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Truck,
  Users,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
  ultimoMovimiento?: Movimiento;
}

type FiltroSaldo = 'todos' | 'con_saldo' | 'al_dia' | 'a_favor';

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaConEntidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState<FiltroSaldo>('todos');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cuentasData, clientes, proveedores, ultimosMovs] = await Promise.all([
        getCuentasCorrientes(),
        getClientes(),
        getProveedores(),
        getUltimosMovimientos(200),
      ]);

      const ultimoPorCuenta = new Map<string, Movimiento>();
      ultimosMovs.forEach((mov) => {
        if (!ultimoPorCuenta.has(mov.cuentaId)) {
          ultimoPorCuenta.set(mov.cuentaId, mov);
        }
      });

      const cuentasConEntidad: CuentaConEntidad[] = cuentasData.map((cuenta) => {
        let entidadNombre = 'N/A';
        if (cuenta.tipoEntidad === 'cliente') {
          const cliente = clientes.find((c) => c.id === cuenta.entidadId);
          entidadNombre = cliente?.razonSocial || 'Cliente no encontrado';
        } else {
          const proveedor = proveedores.find((p) => p.id === cuenta.entidadId);
          entidadNombre = proveedor?.razonSocial || 'Proveedor no encontrado';
        }
        return {
          ...cuenta,
          entidadNombre,
          ultimoMovimiento: ultimoPorCuenta.get(cuenta.id),
        };
      });

      setCuentas(cuentasConEntidad);
      setClientes(clientes);
      setProveedores(proveedores);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar las cuentas');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadEstadoCuenta(cuenta: CuentaConEntidad) {
    setDownloadingId(cuenta.id);
    try {
      const entidad =
        cuenta.tipoEntidad === 'cliente'
          ? clientes.find((c) => c.id === cuenta.entidadId)
          : proveedores.find((p) => p.id === cuenta.entidadId);

      if (!entidad) {
        toast.error('No se encontraron los datos de la entidad');
        return;
      }

      const movimientos = await getMovimientosByCuenta(cuenta.id);
      generateEstadoCuentaPDF({
        entidad,
        cuenta,
        movimientos,
        tipoEntidad: cuenta.tipoEntidad,
      });
      toast.success('Estado de cuenta descargado');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el estado de cuenta');
    } finally {
      setDownloadingId(null);
    }
  }

  const { cuentasClientes, cuentasProveedores, totales } = useMemo(() => {
    const filtered = cuentas.filter((cuenta) => {
      if (!cuenta.entidadNombre.toLowerCase().includes(search.toLowerCase())) return false;
      if (filtroSaldo === 'con_saldo') return cuenta.saldoActual > 0;
      if (filtroSaldo === 'al_dia') return cuenta.saldoActual === 0;
      if (filtroSaldo === 'a_favor') return cuenta.saldoActual < 0;
      return true;
    });

    const clis = filtered.filter((c) => c.tipoEntidad === 'cliente');
    const prov = filtered.filter((c) => c.tipoEntidad === 'proveedor');

    const allClis = cuentas.filter((c) => c.tipoEntidad === 'cliente');
    const allProv = cuentas.filter((c) => c.tipoEntidad === 'proveedor');

    return {
      cuentasClientes: clis,
      cuentasProveedores: prov,
      totales: {
        totalCobrar: allClis.filter((c) => c.saldoActual > 0).reduce((s, c) => s + c.saldoActual, 0),
        totalPagar: allProv.filter((c) => c.saldoActual > 0).reduce((s, c) => s + c.saldoActual, 0),
        clientesConSaldo: allClis.filter((c) => c.saldoActual > 0).length,
        proveedoresConSaldo: allProv.filter((c) => c.saldoActual > 0).length,
        clientesTotal: allClis.length,
        proveedoresTotal: allProv.length,
      },
    };
  }, [cuentas, search, filtroSaldo]);

  const renderTable = (items: CuentaConEntidad[], tipo: 'cliente' | 'proveedor') => {
    if (items.length === 0) {
      return (
        <div className="rounded-md border py-12 text-center text-muted-foreground">
          No hay cuentas que coincidan con los filtros.
        </div>
      );
    }
    return (
      <>
        <div className="hidden overflow-hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{tipo === 'cliente' ? 'Cliente' : 'Proveedor'}</TableHead>
                <TableHead>Último movimiento</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((cuenta) => (
                <TableRow key={cuenta.id} className="group">
                  <TableCell>
                    <Link
                      href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
                      className="flex flex-col"
                    >
                      <span className="font-medium text-foreground group-hover:underline">
                        {cuenta.entidadNombre}
                      </span>
                      {!cuenta.activa && (
                        <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                          Cuenta inactiva
                        </Badge>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {cuenta.ultimoMovimiento ? (
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm text-foreground">
                          {formatDateShort(cuenta.ultimoMovimiento.fecha)}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {cuenta.ultimoMovimiento.descripcion}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin movimientos</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <BalanceDisplay
                      saldo={cuenta.saldoActual}
                      tipoEntidad={tipo}
                      size="md"
                      align="right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                      <Button variant="ghost" size="icon" asChild title="Ver detalle">
                        <Link
                          href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Descargar estado de cuenta"
                        onClick={() => handleDownloadEstadoCuenta(cuenta)}
                        disabled={downloadingId === cuenta.id}
                      >
                        {downloadingId === cuenta.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="default" size="icon" asChild title="Nuevo movimiento">
                        <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                          <Plus className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 md:hidden">
          {items.map((cuenta) => (
            <div key={cuenta.id} className="rounded-md border bg-card p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold">{cuenta.entidadNombre}</p>
                  {cuenta.ultimoMovimiento ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {formatDateShort(cuenta.ultimoMovimiento.fecha)} ·{' '}
                      {cuenta.ultimoMovimiento.descripcion}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Sin movimientos</p>
                  )}
                  {!cuenta.activa && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Cuenta inactiva
                    </Badge>
                  )}
                </Link>
                <BalanceDisplay
                  saldo={cuenta.saldoActual}
                  tipoEntidad={tipo}
                  size="sm"
                  align="right"
                />
              </div>
              <div className="mt-2 flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Ver">
                  <Link
                    href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Descargar"
                  onClick={() => handleDownloadEstadoCuenta(cuenta)}
                  disabled={downloadingId === cuenta.id}
                >
                  {downloadingId === cuenta.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="default" size="icon" className="h-8 w-8" asChild title="Nuevo movimiento">
                  <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Cuentas corrientes
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Saldos y movimientos
          </h1>
          <p className="text-sm text-muted-foreground">
            Controlá lo que te deben y lo que debés, en un solo lugar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total a cobrar"
          value={formatCurrency(totales.totalCobrar)}
          sub={`${totales.clientesConSaldo} cliente${totales.clientesConSaldo === 1 ? '' : 's'} con saldo`}
          tone="positive"
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total a pagar"
          value={formatCurrency(totales.totalPagar)}
          sub={`${totales.proveedoresConSaldo} proveedor${totales.proveedoresConSaldo === 1 ? '' : 'es'} acreedor${totales.proveedoresConSaldo === 1 ? '' : 'es'}`}
          tone="negative"
          icon={<ArrowUpCircle className="h-5 w-5" />}
        />
        <SummaryCard
          label="Balance neto"
          value={formatCurrency(totales.totalCobrar - totales.totalPagar)}
          sub="Cobrar − pagar"
          tone={totales.totalCobrar - totales.totalPagar >= 0 ? 'positive' : 'negative'}
          icon={<Wallet className="h-5 w-5" />}
        />
        <SummaryCard
          label="Cuentas totales"
          value={`${totales.clientesTotal + totales.proveedoresTotal}`}
          sub={`${totales.clientesTotal} clientes · ${totales.proveedoresTotal} proveedores`}
          tone="neutral"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Listado de cuentas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Buscá una entidad o filtrá por estado del saldo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por razón social…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:w-72"
              />
            </div>
            <Select value={filtroSaldo} onValueChange={(v) => setFiltroSaldo(v as FiltroSaldo)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los saldos</SelectItem>
                <SelectItem value="con_saldo">Con saldo pendiente</SelectItem>
                <SelectItem value="al_dia">Al día</SelectItem>
                <SelectItem value="a_favor">Con saldo a favor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="proveedores">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="proveedores" className="flex-1 gap-2 sm:flex-initial">
                <Truck className="h-4 w-4" />
                Proveedores ({cuentasProveedores.length})
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex-1 gap-2 sm:flex-initial">
                <Users className="h-4 w-4" />
                Clientes ({cuentasClientes.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="proveedores" className="mt-0">
              {renderTable(cuentasProveedores, 'proveedor')}
            </TabsContent>
            <TabsContent value="clientes" className="mt-0">
              {renderTable(cuentasClientes, 'cliente')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}) {
  const toneStyle =
    tone === 'positive'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : tone === 'negative'
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
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
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
