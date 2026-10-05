'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Producto,
  CambioCosto,
  MovimientoStock,
  ItemCatalogo,
  Proveedor,
  MotivoAjuste,
  MOTIVOS_AJUSTE,
} from '@/types';
import {
  getProducto,
  getHistorialCostos,
  getMovimientosStock,
  getProveedoresDeProducto,
  getProveedores,
  ajustarStock,
} from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import {
  formatCurrency,
  formatDateShort,
  formatMotivoAjuste,
  formatOrigenStock,
} from '@/lib/formatters';
import { abrevUnidad, describirPresentacion, formatCantidad } from '@/lib/presentaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Pencil, Scale, TrendingDown, TrendingUp } from 'lucide-react';

export default function ProductoDetallePage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [costos, setCostos] = useState<CambioCosto[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [ofertas, setOfertas] = useState<ItemCatalogo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [contado, setContado] = useState('');
  const [motivo, setMotivo] = useState<MotivoAjuste>('recuento');
  const [detalle, setDetalle] = useState('');
  const [ajustando, setAjustando] = useState(false);

  const cargar = useCallback(async () => {
    const [p, c, m, o, prov] = await Promise.all([
      getProducto(empresaId, id),
      getHistorialCostos(empresaId, id),
      getMovimientosStock(empresaId, id),
      getProveedoresDeProducto(empresaId, id),
      getProveedores(empresaId),
    ]);
    return { p, c, m, o, prov };
  }, [empresaId, id]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { p, c, m, o, prov } = await cargar();
        if (!p) {
          if (!cancelado) {
            toast.error('Producto no encontrado');
            router.push('/productos');
          }
          return;
        }
        if (!cancelado) {
          setProducto(p);
          setCostos(c);
          setMovimientos(m);
          setOfertas(o);
          setProveedores(prov);
        }
      } catch (error) {
        console.error('Error loading producto:', error);
        if (!cancelado) toast.error('Error al cargar el producto');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [cargar, router]);

  async function aplicarAjuste() {
    if (!producto) return;
    const cantidad = Number(contado);
    if (contado === '' || Number.isNaN(cantidad)) return toast.error('Poné la cantidad contada');

    setAjustando(true);
    try {
      await ajustarStock(empresaId, producto.id, cantidad, motivo, detalle || undefined);
      const { p, m } = await cargar();
      if (p) setProducto(p);
      setMovimientos(m);
      setAjusteOpen(false);
      setContado('');
      setDetalle('');
      toast.success('Stock ajustado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo ajustar');
    } finally {
      setAjustando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!producto) return null;

  const u = producto.unidad;
  const nombreProveedor = (pid: string) =>
    proveedores.find((x) => x.id === pid)?.razonSocial ?? 'Proveedor';

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/productos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Productos
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{producto.nombre}</h1>
              <Badge variant={producto.activo ? 'default' : 'secondary'}>
                {producto.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              #{producto.codigo} · se mide en {abrevUnidad(u)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAjusteOpen(true)}>
              <Scale className="mr-2 h-4 w-4" />
              Ajustar stock
            </Button>
            <Button asChild variant="outline">
              <Link href={`/productos/${producto.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quién lo vende</CardTitle>
            </CardHeader>
            <CardContent>
              {ofertas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Ningún proveedor tiene este producto en su catálogo todavía.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Por {abrevUnidad(u)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ofertas.map((o, idx) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/proveedores/${o.proveedorId}`}
                            className="font-medium hover:underline"
                          >
                            {nombreProveedor(o.proveedorId)}
                          </Link>
                          {idx === 0 && ofertas.length > 1 && (
                            <Badge variant="outline" className="ml-2">
                              Más barato
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {o.presentacionId
                            ? `${o.presentacionNombre} de ${o.factor} ${abrevUnidad(u)}`
                            : `Suelto (${abrevUnidad(u)})`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(o.costoPresentacion)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(o.costoPresentacion / o.factor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimientos de stock</CardTitle>
              <p className="text-sm text-muted-foreground">
                De dónde salió y a dónde fue cada unidad.
              </p>
            </CardHeader>
            <CardContent>
              {movimientos.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin movimientos registrados.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Queda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateShort(m.fecha)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatOrigenStock(m.origen)}</span>
                          {m.origenNumero > 0 && (
                            <span className="text-xs text-muted-foreground"> #{m.origenNumero}</span>
                          )}
                          {m.motivo && (
                            <span className="block text-xs text-muted-foreground">
                              {formatMotivoAjuste(m.motivo)}
                              {m.detalle && ` · ${m.detalle}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className={
                            m.tipo === 'entrada'
                              ? 'text-right tabular-nums text-emerald-600 dark:text-emerald-400'
                              : 'text-right tabular-nums text-rose-600 dark:text-rose-400'
                          }
                        >
                          {m.tipo === 'entrada' ? '+' : '−'}
                          {m.cantidad}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {m.stockPosterior}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de costos</CardTitle>
            </CardHeader>
            <CardContent>
              {costos.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  El costo no cambió desde que se cargó el producto.
                </p>
              ) : (
                <ul className="divide-y">
                  {costos.map((c) => {
                    const subio = c.costoNuevo > c.costoAnterior;
                    const Icono = subio ? TrendingUp : TrendingDown;
                    return (
                      <li key={c.id} className="flex items-center gap-3 py-3">
                        <Icono
                          className={
                            subio
                              ? 'h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400'
                              : 'h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-sm">
                            <span className="tabular-nums line-through text-muted-foreground">
                              {formatCurrency(c.costoAnterior)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium tabular-nums">
                              {formatCurrency(c.costoNuevo)}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(c.fecha)} · {c.proveedorNombre} · recepción #
                            {c.recepcionNumero}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold tabular-nums">
                {formatCantidad(producto.stockActual, u)}
              </p>
              <p className="text-sm text-muted-foreground">
                Mínimo: {formatCantidad(producto.stockMinimo, u)}
              </p>
              {producto.stockActual <= producto.stockMinimo && (
                <Badge variant="secondary">Conviene reponer</Badge>
              )}
              <div className="border-t pt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valorizado a costo</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(producto.stockActual * producto.precioCompra)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo</span>
                <span className="tabular-nums">
                  {formatCurrency(producto.precioCompra)} / {abrevUnidad(u)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venta</span>
                <span className="tabular-nums">
                  {formatCurrency(producto.precioVenta)} / {abrevUnidad(u)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presentaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {producto.presentaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Se opera de a {abrevUnidad(u)}.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {producto.presentaciones.map((p) => (
                    <li key={p.id}>{describirPresentacion(p, u)}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={ajusteOpen} onOpenChange={(v) => !ajustando && setAjusteOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock de {producto.nombre}</DialogTitle>
            <DialogDescription>
              Poné lo que contaste físicamente. La diferencia contra las{' '}
              {formatCantidad(producto.stockActual, u)} del sistema queda registrada con su
              motivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contado">Cantidad contada ({abrevUnidad(u)}) *</Label>
              <Input
                id="contado"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={contado}
                onChange={(e) => setContado(e.target.value)}
                disabled={ajustando}
              />
              {contado !== '' && !Number.isNaN(Number(contado)) && (
                <p className="text-xs text-muted-foreground">
                  Diferencia: {Number(contado) - producto.stockActual > 0 ? '+' : ''}
                  {Number(contado) - producto.stockActual} {abrevUnidad(u)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select
                value={motivo}
                onValueChange={(v) => setMotivo((v as MotivoAjuste) ?? 'recuento')}
                disabled={ajustando}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_AJUSTE.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalleAjuste">Aclaración</Label>
              <Input
                id="detalleAjuste"
                placeholder="Opcional"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                disabled={ajustando}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteOpen(false)} disabled={ajustando}>
              Cancelar
            </Button>
            <Button onClick={aplicarAjuste} disabled={ajustando}>
              {ajustando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Ajustar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
