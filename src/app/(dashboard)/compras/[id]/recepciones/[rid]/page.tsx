'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Recepcion, Proveedor } from '@/types';
import { getRecepcion, getProveedor, anularRecepcion } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency, formatDateShort, formatMedioPago } from '@/lib/formatters';
import { generateComprobanteRecepcionPDF } from '@/lib/pdf-generator';
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
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Download, Loader2, XCircle } from 'lucide-react';

export default function RecepcionDetallePage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const router = useRouter();
  const ordenId = params.id as string;
  const rid = params.rid as string;

  const [recepcion, setRecepcion] = useState<Recepcion | null>(null);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const r = await getRecepcion(empresaId, rid);
        if (!r) {
          if (!cancelado) {
            toast.error('Recepción no encontrada');
            router.push(`/compras/${ordenId}`);
          }
          return;
        }
        const prov = await getProveedor(empresaId, r.proveedorId);
        if (!cancelado) {
          setRecepcion(r);
          setProveedor(prov);
        }
      } catch (error) {
        console.error('Error loading recepcion:', error);
        if (!cancelado) toast.error('Error al cargar la recepción');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId, rid, ordenId, router]);

  async function handleAnular() {
    if (!recepcion) return;
    setAnulando(true);
    try {
      await anularRecepcion(empresaId, recepcion.id);
      toast.success('Recepción anulada');
      const actualizada = await getRecepcion(empresaId, recepcion.id);
      if (actualizada) setRecepcion(actualizada);
      setConfirmOpen(false);
    } catch (error) {
      // Acá cae el caso de "la mercadería ya se vendió": el mensaje del
      // backend explica exactamente qué producto lo impide.
      toast.error(error instanceof Error ? error.message : 'No se pudo anular la recepción');
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

  if (!recepcion) return null;

  const anulada = recepcion.estado === 'anulada';
  const comprobante = [recepcion.comprobanteTipo, recepcion.comprobanteNumero]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href={`/compras/${ordenId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orden #{recepcion.ordenCompraNumero}
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Recepción #{recepcion.numero}</h1>
              <Badge variant={anulada ? 'destructive' : 'default'}>
                {anulada ? 'Anulada' : 'Completada'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateShort(recepcion.fecha)} · {recepcion.proveedorNombre}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                proveedor && generateComprobanteRecepcionPDF({ recepcion, proveedor })
              }
              disabled={!proveedor}
            >
              <Download className="mr-2 h-4 w-4" />
              Comprobante
            </Button>

            {!anulada && (
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
                    <DialogTitle>Anular la recepción #{recepcion.numero}</DialogTitle>
                    <DialogDescription>
                      Descuenta del stock la mercadería que ingresó, revierte la deuda con el
                      proveedor y devuelve la orden a pendiente. Si algo de esto ya se vendió,
                      la anulación no va a poder completarse. El costo del producto no se
                      revierte.
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
                      {anulando ? 'Anulando...' : 'Anular recepción'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mercadería recibida</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recepcion.items.map((it) => (
                  <TableRow key={it.productoId}>
                    <TableCell>
                      <span className="font-medium">{it.productoNombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        #{it.productoCodigo}
                      </span>
                      {it.actualizoCosto && it.costoAnterior !== it.costoUnitario && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          Costo actualizado:
                          <span className="line-through">
                            {formatCurrency(it.costoAnterior)}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">{formatCurrency(it.costoUnitario)}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {it.cantidad} {it.unidad}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(it.costoUnitario)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(it.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(recepcion.total)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Medio de pago</span>
                <span>{formatMedioPago(recepcion.medioPago)}</span>
              </div>
              {comprobante && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Comprobante</span>
                  <span>{comprobante}</span>
                </div>
              )}
              {recepcion.anuladaAt && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Anulada el</span>
                  <span>{formatDateShort(recepcion.anuladaAt)}</span>
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                <Link href={`/proveedores/${recepcion.proveedorId}`}>Ver cuenta corriente</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
