'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Cliente, CuentaCorriente, Movimiento } from '@/types';
import {
  getCliente,
  getCuentaByEntidad,
  getMovimientosByCuenta,
} from '@/lib/firebase-db';
import {
  formatCUIT,
  formatCondicionIva,
  formatCurrency,
} from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { MovimientosTable } from '@/components/cuentas/movimientos-table';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Loader2,
  Users,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cuenta, setCuenta] = useState<CuentaCorriente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const clienteData = await getCliente(id);
        if (!clienteData) {
          toast.error('Cliente no encontrado');
          return;
        }
        setCliente(clienteData);

        const cuentaData = await getCuentaByEntidad(id, 'cliente');
        if (cuentaData) {
          setCuenta(cuentaData);
          const movimientosData = await getMovimientosByCuenta(cuentaData.id);
          setMovimientos(movimientosData);
        }
      } catch (error) {
        console.error('Error loading cliente:', error);
        toast.error('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/clientes">Volver a clientes</Link>
        </Button>
      </div>
    );
  }

  const saldo = cuenta?.saldoActual || 0;
  const usoCredito = cliente.limiteCredito > 0 ? (saldo / cliente.limiteCredito) * 100 : 0;
  const sobreLimite = saldo > cliente.limiteCredito && cliente.limiteCredito > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cliente
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{cliente.razonSocial}</h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>CUIT {formatCUIT(cliente.cuit)}</span>
                <span>·</span>
                <span>{formatCondicionIva(cliente.condicionIva)}</span>
                <Badge variant={cliente.activo ? 'default' : 'secondary'} className="ml-1">
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clientes/${id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {cuenta && (
            <Button asChild>
              <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo movimiento
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Saldo en cuenta corriente
              </p>
              <BalanceDisplay
                saldo={saldo}
                tipoEntidad="cliente"
                size="xl"
                showLabel={false}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {saldo > 0
                  ? 'Monto pendiente de cobro'
                  : saldo < 0
                    ? 'Saldo a favor del cliente'
                    : 'La cuenta está al día'}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Movimientos
              </p>
              <p className="text-2xl font-bold tabular-nums">{movimientos.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Límite otorgado</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(cliente.limiteCredito)}
              </p>
            </div>
            {cliente.limiteCredito > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uso</span>
                  <span
                    className={
                      sobreLimite
                        ? 'font-semibold text-rose-600'
                        : 'font-medium text-foreground'
                    }
                  >
                    {Math.round(Math.max(0, usoCredito))}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      sobreLimite
                        ? 'h-full bg-rose-500'
                        : usoCredito > 70
                          ? 'h-full bg-amber-500'
                          : 'h-full bg-emerald-500'
                    }
                    style={{ width: `${Math.min(100, Math.max(0, usoCredito))}%` }}
                  />
                </div>
                {sobreLimite && (
                  <p className="flex items-center gap-1 text-xs text-rose-600">
                    <AlertTriangle className="h-3 w-3" />
                    Superó el límite de crédito
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} value={cliente.telefono} />
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={cliente.email} />
            <div className="pt-1 text-xs text-muted-foreground">Referente</div>
            <p className="font-medium">{cliente.contacto || '—'}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Dirección
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              {cliente.direccion.calle}, {cliente.direccion.ciudad}
            </p>
            <p className="text-muted-foreground">
              {cliente.direccion.provincia} · CP {cliente.direccion.codigoPostal}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <MovimientosTable movimientos={movimientos} tipoEntidad="cliente" />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span>{value || '—'}</span>
    </div>
  );
}
