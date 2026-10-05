'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { OrdenCompra, Recepcion, Proveedor } from '@/types';
import {
  getOrdenCompra,
  getRecepcionesByOrden,
  getProveedor,
  anularOrdenCompra,
} from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency, formatDateShort, formatEstadoOrden } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { generateOrdenCompraPDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { ArrowLeft, Download, Loader2, PackageCheck, Truck, XCircle } from 'lucide-react';

export default function OrdenCompraDetallePage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const o = await getOrdenCompra(empresaId, id);
        if (!o) {
          if (!cancelado) {
            toast.error('Orden no encontrada');
            router.push('/compras');
          }
          return;
        }
        const [recs, prov] = await Promise.all([
          getRecepcionesByOrden(empresaId, id),
          getProveedor(empresaId, o.proveedorId),
        ]);
        if (!cancelado) {
          setOrden(o);
          setRecepciones(recs);
          setProveedor(prov);
        }
      } catch (error) {
        console.error('Error loading orden:', error);
        if (!cancelado) toast.error('Error al cargar la orden');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId, id, router]);

  async function handleAnular() {
    if (!orden) return;
    setAnulando(true);
    try {
      await anularOrdenCompra(empresaId, orden.id);
      toast.success('Orden anulada');
      const actualizada = await getOrdenCompra(empresaId, orden.id);
      if (actualizada) setOrden(actualizada);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo anular la orden');
    } finally {
      setAnulando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orden) return null;

  const puedeRecibir = orden.estado === 'pendiente' || orden.estado === 'parcial';
  const puedeAnular = orden.estado === 'pendiente';

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/compras">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Compras
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {orden.directa ? 'Compra' : 'Orden'} #{orden.numero}
              </h1>
              <Badge variant={orden.estado === 'anulada' ? 'destructive' : 'default'}>
                {formatEstadoOrden(orden.estado)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateShort(orden.fecha)} · {orden.proveedorNombre}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => proveedor && generateOrdenCompraPDF({ orden, proveedor })}
              disabled={!proveedor}
            >
              <Download className="mr-2 h-4 w-4" />
              Orden PDF
            </Button>

            {puedeRecibir && (
              <Button asChild>
                <Link href={`/compras/${orden.id}/recepcion`}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Recibir mercadería
                </Link>
              </Button>
            )}

            {puedeAnular && (
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger
                  render={
                    <Button variant="outline">
                      <XCircle className="mr-2 h-4 w-4" />
                      Anular
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Anular la orden #{orden.numero}</DialogTitle>
                    <DialogDescription>
                      La orden queda cancelada. Como todavía no recibió mercadería, no hay
                      stock ni saldo que revertir.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmOpen(false)}
                      disabled={anulando}
                    >
                      Volver
                    </Button>
                    <Button variant="destructive" onClick={handleAnular} disabled={anulando}>
                      {anulando ? 'Anulando...' : 'Anular orden'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Pedido</TableHead>
                    <TableHead className="text-right">Recibido</TableHead>
                    <TableHead className="text-right">Costo unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.items.map((it) => {
                    const completo = it.cantidadRecibida >= it.cantidad;
                    return (
                      <TableRow key={it.productoId}>
                        <TableCell>
                          <span className="font-medium">{it.productoNombre}</span>
                          <span className="block text-xs text-muted-foreground">
                            #{it.productoCodigo}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.cantidad} {it.unidad}
                        </TableCell>
                        <TableCell
                          className={
                            completo
                              ? 'text-right tabular-nums text-emerald-600 dark:text-emerald-400'
                              : 'text-right tabular-nums text-amber-600 dark:text-amber-400'
                          }
                        >
                          {it.cantidadRecibida}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(it.costoUnitario)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(it.subtotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Recepciones {recepciones.length > 0 && `(${recepciones.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recepciones.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todavía no se recibió nada de esta orden.
                </p>
              ) : (
                <ul className="divide-y">
                  {recepciones.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/compras/${orden.id}/recepciones/${r.id}`}
                        className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            Recepción #{r.numero}
                            {r.estado === 'anulada' && (
                              <Badge variant="destructive" className="ml-2">
                                Anulada
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(r.fecha)} · {r.items.length}{' '}
                            {r.items.length === 1 ? 'producto' : 'productos'}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm tabular-nums">
                          {formatCurrency(r.total)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {orden.observaciones && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{orden.observaciones}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{formatCurrency(orden.total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Truck className="h-4 w-4 text-muted-foreground" />
                {orden.proveedorNombre}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/proveedores/${orden.proveedorId}`}>Ver cuenta corriente</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
