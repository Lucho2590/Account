'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Cliente, CuentaCorriente, Movimiento } from '@/types';
import { getCliente, getCuentaByEntidad, getMovimientosByCuenta } from '@/lib/firebase-db';
import { formatCUIT, formatCondicionIva, formatCurrency, formatDateShort, formatConcepto } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Pencil, Plus, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/clientes">Volver a Clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{cliente.razonSocial}</h1>
            <p className="text-muted-foreground">{formatCUIT(cliente.cuit)}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/clientes/${id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Condición IVA</p>
                <p className="font-medium">{formatCondicionIva(cliente.condicionIva)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Límite de Crédito</p>
                <p className="font-medium">{formatCurrency(cliente.limiteCredito)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">{cliente.contacto || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto y Dirección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-medium">
                {cliente.direccion.calle}, {cliente.direccion.ciudad}
              </p>
              <p className="text-sm text-muted-foreground">
                {cliente.direccion.provincia} - CP: {cliente.direccion.codigoPostal}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{cliente.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{cliente.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cuenta Corriente</CardTitle>
            <CardDescription>
              Saldo actual:{' '}
              <span
                className={`font-bold ${
                  (cuenta?.saldoActual || 0) > 0 ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                {formatCurrency(cuenta?.saldoActual || 0)}
              </span>
            </CardDescription>
          </div>
          {cuenta && (
            <Button asChild>
              <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Movimiento
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {movimientos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay movimientos registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>{formatDateShort(mov.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatConcepto(mov.concepto)}</Badge>
                    </TableCell>
                    <TableCell>{mov.descripcion}</TableCell>
                    <TableCell className="text-right">
                      {mov.tipo === 'debe' ? (
                        <span className="text-green-600 flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {formatCurrency(mov.monto)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {mov.tipo === 'haber' ? (
                        <span className="text-red-600 flex items-center justify-end gap-1">
                          <ArrowDownRight className="h-3 w-3" />
                          {formatCurrency(mov.monto)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(mov.saldoPosterior)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
