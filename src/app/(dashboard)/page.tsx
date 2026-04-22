'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, formatDateShort, formatConcepto } from '@/lib/formatters';
import {
  getResumenCuentas,
  getAlertasStock,
  getUltimosMovimientos,
  getCuentasCorrientes,
  getClientes,
  getProveedores,
} from '@/lib/firebase-db';
import type { ResumenCuentas, AlertaStock, Movimiento } from '@/types';

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenCuentas | null>(null);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [entidades, setEntidades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resumenData, alertasData, movimientosData, cuentas, clientes, proveedores] =
          await Promise.all([
            getResumenCuentas(),
            getAlertasStock(),
            getUltimosMovimientos(5),
            getCuentasCorrientes(),
            getClientes(),
            getProveedores(),
          ]);

        setResumen(resumenData);
        setAlertas(alertasData);
        setMovimientos(movimientosData);

        // Crear mapa de entidades para mostrar nombres
        const entidadesMap: Record<string, string> = {};
        cuentas.forEach((cuenta) => {
          if (cuenta.tipoEntidad === 'cliente') {
            const cliente = clientes.find((c) => c.id === cuenta.entidadId);
            if (cliente) entidadesMap[cuenta.id] = cliente.razonSocial;
          } else {
            const proveedor = proveedores.find((p) => p.id === cuenta.entidadId);
            if (proveedor) entidadesMap[cuenta.id] = proveedor.razonSocial;
          }
        });
        setEntidades(entidadesMap);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Widgets principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total a Cobrar
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumen?.totalCobrar || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.cantidadClientesDeudores || 0} clientes con saldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total a Pagar
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumen?.totalPagar || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumen?.cantidadProveedoresAcreedores || 0} proveedores acreedores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumen?.cantidadClientesDeudores || 0}
            </div>
            <p className="text-xs text-muted-foreground">con cuenta corriente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertas.length}</div>
            <p className="text-xs text-muted-foreground">productos bajo mínimo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Últimos movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Movimientos</CardTitle>
            <CardDescription>Movimientos recientes en cuentas corrientes</CardDescription>
          </CardHeader>
          <CardContent>
            {movimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay movimientos registrados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm">
                        {formatDateShort(mov.fecha)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entidades[mov.cuentaId] || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === 'debe' ? 'default' : 'secondary'}>
                          {formatConcepto(mov.concepto)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            mov.tipo === 'debe' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {mov.tipo === 'debe' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatCurrency(mov.monto)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Alertas de stock */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
            <CardDescription>Productos con stock bajo mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay alertas de stock
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.productoId}>
                      <TableCell className="font-medium">
                        {alerta.productoNombre}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{alerta.stockActual}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {alerta.stockMinimo}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
