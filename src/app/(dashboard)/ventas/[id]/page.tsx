'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Loader2,
  Receipt,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Cliente, Venta } from '@/types';
import { anularVenta, getCliente, getVenta } from '@/lib/firebase-db';
import { generateComprobanteVentaPDF } from '@/lib/pdf-generator';
import {
  formatCurrency,
  formatDateShort,
  formatEstadoVenta,
  formatMedioPago,
} from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function VentaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [venta, setVenta] = useState<Venta | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const v = await getVenta(id);
        if (!v) {
          toast.error('Venta no encontrada');
          router.push('/ventas');
          return;
        }
        const c = await getCliente(v.clienteId);
        if (!cancelled) {
          setVenta(v);
          setCliente(c);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleAnular() {
    if (!venta) return;
    setAnulando(true);
    try {
      await anularVenta(venta.id);
      toast.success(`Venta #${venta.numero} anulada`);
      const updated = await getVenta(venta.id);
      setVenta(updated);
      setConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al anular la venta';
      toast.error(msg);
    } finally {
      setAnulando(false);
    }
  }

  function handleDownload() {
    if (!venta || !cliente) return;
    generateComprobanteVentaPDF({ venta, cliente });
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!venta || !cliente) return null;

  const anulada = venta.estado === 'anulada';
  const comprobante = [venta.comprobanteTipo, venta.comprobanteNumero]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/ventas" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Venta #{venta.numero}</h1>
              {anulada ? (
                <Badge variant="destructive" className="font-normal">
                  Anulada
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 font-normal text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {formatEstadoVenta(venta.estado)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateShort(venta.fecha)} · {cliente.razonSocial}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Comprobante
          </Button>
          {!anulada && (
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                  />
                }
              >
                <XCircle className="h-4 w-4" />
                Anular
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Anular venta #{venta.numero}
                  </DialogTitle>
                  <DialogDescription>
                    Esta acción revierte el stock de los productos y crea movimientos
                    compensatorios en la cuenta corriente del cliente. No se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleAnular}
                    disabled={anulando}
                    className="gap-2"
                  >
                    {anulando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Anulando…
                      </>
                    ) : (
                      'Confirmar anulación'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.items.map((it, idx) => (
                    <TableRow key={`${it.productoId}-${idx}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{it.productoNombre}</span>
                          <span className="text-xs text-muted-foreground">
                            #{it.productoCodigo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.cantidad} {it.unidad}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.precioUnitario)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(it.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {venta.observaciones && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observaciones</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {venta.observaciones}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">
                {formatCurrency(venta.total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {venta.items.length} {venta.items.length === 1 ? 'item' : 'items'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Medio de pago" value={formatMedioPago(venta.medioPago)} />
              {comprobante && <InfoRow label="Comprobante" value={comprobante} icon={<Receipt className="h-3 w-3" />} />}
              <InfoRow label="Fecha" value={formatDateShort(venta.fecha)} />
              {venta.anuladaAt && (
                <InfoRow label="Anulada el" value={formatDateShort(venta.anuladaAt)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{cliente.razonSocial}</p>
              <p className="text-muted-foreground">CUIT: {cliente.cuit}</p>
              <Button asChild variant="link" size="sm" className="mt-2 h-auto gap-1 p-0">
                <Link href={`/clientes/${venta.clienteId}`}>
                  <Wallet className="h-3 w-3" />
                  Ver cuenta corriente
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1 font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}
