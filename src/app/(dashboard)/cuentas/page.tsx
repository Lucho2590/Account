'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CuentaCorriente, Cliente, Proveedor } from '@/types';
import { getCuentasCorrientes, getClientes, getProveedores } from '@/lib/firebase-db';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Plus, Search, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
}

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaConEntidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cuentasData, clientes, proveedores] = await Promise.all([
        getCuentasCorrientes(),
        getClientes(),
        getProveedores(),
      ]);

      const cuentasConEntidad: CuentaConEntidad[] = cuentasData.map((cuenta) => {
        let entidadNombre = 'N/A';
        if (cuenta.tipoEntidad === 'cliente') {
          const cliente = clientes.find((c) => c.id === cuenta.entidadId);
          entidadNombre = cliente?.razonSocial || 'Cliente no encontrado';
        } else {
          const proveedor = proveedores.find((p) => p.id === cuenta.entidadId);
          entidadNombre = proveedor?.razonSocial || 'Proveedor no encontrado';
        }
        return { ...cuenta, entidadNombre };
      });

      setCuentas(cuentasConEntidad);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar las cuentas');
    } finally {
      setLoading(false);
    }
  }

  const filteredCuentas = cuentas.filter((cuenta) =>
    cuenta.entidadNombre.toLowerCase().includes(search.toLowerCase())
  );

  const cuentasClientes = filteredCuentas.filter((c) => c.tipoEntidad === 'cliente');
  const cuentasProveedores = filteredCuentas.filter((c) => c.tipoEntidad === 'proveedor');

  const totalCobrar = cuentasClientes
    .filter((c) => c.saldoActual > 0)
    .reduce((sum, c) => sum + c.saldoActual, 0);

  const totalPagar = cuentasProveedores
    .filter((c) => c.saldoActual > 0)
    .reduce((sum, c) => sum + c.saldoActual, 0);

  const renderTable = (items: CuentaConEntidad[], tipo: 'cliente' | 'proveedor') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tipo === 'cliente' ? 'Cliente' : 'Proveedor'}</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          {tipo === 'cliente' && <TableHead className="text-right">Límite Crédito</TableHead>}
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={tipo === 'cliente' ? 5 : 4} className="text-center py-8 text-muted-foreground">
              No hay cuentas registradas
            </TableCell>
          </TableRow>
        ) : (
          items.map((cuenta) => (
            <TableRow key={cuenta.id}>
              <TableCell className="font-medium">{cuenta.entidadNombre}</TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-medium ${
                    cuenta.saldoActual > 0
                      ? tipo === 'cliente'
                        ? 'text-green-600'
                        : 'text-red-600'
                      : ''
                  }`}
                >
                  {formatCurrency(cuenta.saldoActual)}
                </span>
              </TableCell>
              {tipo === 'cliente' && (
                <TableCell className="text-right text-muted-foreground">
                  {cuenta.limiteCredito ? formatCurrency(cuenta.limiteCredito) : '-'}
                </TableCell>
              )}
              <TableCell>
                <Badge variant={cuenta.activa ? 'default' : 'secondary'}>
                  {cuenta.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/${tipo === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
        <p className="text-muted-foreground">Panel de control de cuentas corrientes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total a Cobrar
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCobrar)}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuentasClientes.filter((c) => c.saldoActual > 0).length} clientes con saldo
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
              {formatCurrency(totalPagar)}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuentasProveedores.filter((c) => c.saldoActual > 0).length} proveedores acreedores
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes">
            Clientes ({cuentasClientes.length})
          </TabsTrigger>
          <TabsTrigger value="proveedores">
            Proveedores ({cuentasProveedores.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas de Clientes</CardTitle>
              <CardDescription>Saldos a cobrar de clientes</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(cuentasClientes, 'cliente')}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="proveedores">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas de Proveedores</CardTitle>
              <CardDescription>Saldos a pagar a proveedores</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(cuentasProveedores, 'proveedor')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
