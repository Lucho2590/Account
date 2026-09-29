'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Empresa, CuentaCorriente, Cliente, Proveedor, Usuario, Movimiento } from '@/types';
import {
  getEmpresa,
  getCuentasCorrientes,
  getClientes,
  getProveedores,
  getUsuarios,
  getMovimientosByCuenta,
} from '@/lib/firebase-db';
import { KpiCard } from '@/components/shared/kpi-card';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { MovimientosTable } from '@/components/cuentas/movimientos-table';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RUTA_SUPER_INICIO } from '@/components/layout/nav-items';
import {
  ArrowLeft,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Users as UsersIcon,
  Eye,
  LogIn,
} from 'lucide-react';

type CuentaConEntidad = CuentaCorriente & { entidadNombre: string };

export default function EmpresaDetallePage() {
  const { impersonar } = useAuth();
  const router = useRouter();
  const params = useParams();
  const empresaId = params.id as string;

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cuentas, setCuentas] = useState<CuentaConEntidad[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Detalle de movimientos de una cuenta, en un diálogo: el superusuario
  // consulta, no navega a pantallas de edición.
  const [detalle, setDetalle] = useState<{ cuenta: CuentaConEntidad; movimientos: Movimiento[] } | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [emp, cc, clientes, proveedores, users] = await Promise.all([
          getEmpresa(empresaId),
          getCuentasCorrientes(empresaId),
          getClientes(empresaId),
          getProveedores(empresaId),
          getUsuarios(empresaId),
        ]);

        const porId = new Map<string, string>();
        clientes.forEach((c: Cliente) => porId.set(c.id, c.razonSocial));
        proveedores.forEach((p: Proveedor) => porId.set(p.id, p.razonSocial));

        if (cancelado) return;
        setEmpresa(emp);
        setUsuarios(users);
        setCuentas(
          cc.map((c) => ({ ...c, entidadNombre: porId.get(c.entidadId) || 'Sin nombre' })),
        );
      } catch (error) {
        console.error('Error loading empresa:', error);
        if (!cancelado) toast.error('Error al cargar la empresa');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  async function verMovimientos(cuenta: CuentaConEntidad) {
    setCargandoDetalle(cuenta.id);
    try {
      const movimientos = await getMovimientosByCuenta(empresaId, cuenta.id);
      setDetalle({ cuenta, movimientos });
    } catch (error) {
      console.error('Error loading movimientos:', error);
      toast.error('Error al cargar los movimientos');
    } finally {
      setCargandoDetalle(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href={RUTA_SUPER_INICIO}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <p className="text-muted-foreground">La empresa no existe o fue eliminada.</p>
      </div>
    );
  }

  const clientes = cuentas.filter((c) => c.tipoEntidad === 'cliente');
  const proveedores = cuentas.filter((c) => c.tipoEntidad === 'proveedor');
  const totalCobrar = clientes.reduce((a, c) => a + Math.max(c.saldoActual, 0), 0);
  const totalPagar = proveedores.reduce((a, c) => a + Math.max(c.saldoActual, 0), 0);

  const tabla = (items: CuentaConEntidad[], tipo: 'cliente' | 'proveedor') =>
    items.length === 0 ? (
      <div className="py-8 text-center text-muted-foreground">Sin cuentas cargadas</div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tipo === 'cliente' ? 'Cliente' : 'Proveedor'}</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Movimientos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.entidadNombre}
                {!c.activa && (
                  <Badge variant="secondary" className="ml-2">
                    Inactiva
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <BalanceDisplay saldo={c.saldoActual} tipoEntidad={c.tipoEntidad} align="right" />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => verMovimientos(c)}
                  disabled={cargandoDetalle === c.id}
                  aria-label="Ver movimientos"
                >
                  {cargandoDetalle === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={RUTA_SUPER_INICIO}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Empresas
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{empresa.nombre}</h1>
          <Badge variant={empresa.activa ? 'default' : 'secondary'}>
            {empresa.activa ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">CUIT {empresa.cuit}</p>
          <Button
            onClick={() => {
              impersonar(empresa.id);
              router.push('/');
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar al panel
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total a cobrar"
          value={formatCurrency(totalCobrar)}
          sub={`${clientes.length} cuentas de clientes`}
          tone="positive"
          icon={ArrowDownCircle}
        />
        <KpiCard
          label="Total a pagar"
          value={formatCurrency(totalPagar)}
          sub={`${proveedores.length} cuentas de proveedores`}
          tone="negative"
          icon={ArrowUpCircle}
        />
        <KpiCard
          label="Balance neto"
          value={formatCurrency(totalCobrar - totalPagar)}
          tone={totalCobrar - totalPagar >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
        />
        <KpiCard label="Usuarios" value={usuarios.length} icon={UsersIcon} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas corrientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clientes">
            <TabsList>
              <TabsTrigger value="clientes">Clientes ({clientes.length})</TabsTrigger>
              <TabsTrigger value="proveedores">Proveedores ({proveedores.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="clientes">{tabla(clientes, 'cliente')}</TabsContent>
            <TabsContent value="proveedores">{tabla(proveedores, 'proveedor')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Sin usuarios</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.rol === 'dueno' ? 'Dueño' : 'Empleado'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.activo ? 'default' : 'secondary'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Movimientos · {detalle?.cuenta.entidadNombre}</DialogTitle>
          </DialogHeader>
          {detalle && (
            <MovimientosTable
              movimientos={detalle.movimientos}
              tipoEntidad={detalle.cuenta.tipoEntidad}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
