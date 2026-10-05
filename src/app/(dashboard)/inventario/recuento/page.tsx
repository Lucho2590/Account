'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Producto, MotivoAjuste, MOTIVOS_AJUSTE } from '@/types';
import { getProductos, ajustarStockMasivo } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { abrevUnidad, formatCantidad } from '@/lib/presentaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Search } from 'lucide-react';

export default function RecuentoPage() {
  const empresaId = useEmpresaId();
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [motivo, setMotivo] = useState<MotivoAjuste>('recuento');
  const [detalle, setDetalle] = useState('');
  const [guardando, setGuardando] = useState(false);

  /** Lo contado por producto. Vacío = no se contó, no se toca. */
  const [contado, setContado] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const data = await getProductos(empresaId);
        if (!cancelado) setProductos(data.filter((p) => p.activo));
      } catch (error) {
        console.error('Error loading productos:', error);
        if (!cancelado) toast.error('Error al cargar los productos');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q),
    );
  }, [productos, search]);

  // Solo lo que se contó Y difiere de lo que dice el sistema.
  const diferencias = useMemo(
    () =>
      productos
        .map((p) => {
          const raw = contado[p.id];
          if (raw === undefined || raw === '') return null;
          const cantidad = Number(raw);
          if (Number.isNaN(cantidad) || cantidad === p.stockActual) return null;
          return { producto: p, cantidad, delta: cantidad - p.stockActual };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [productos, contado],
  );

  const impactoValorizado = diferencias.reduce(
    (s, d) => s + d.delta * d.producto.precioCompra,
    0,
  );

  async function aplicar() {
    if (diferencias.length === 0) return;
    setGuardando(true);
    try {
      const { aplicados, errores } = await ajustarStockMasivo(
        empresaId,
        diferencias.map((d) => ({ productoId: d.producto.id, cantidadContada: d.cantidad })),
        motivo,
        detalle || undefined,
      );

      if (errores.length > 0) {
        toast.error(`Se aplicaron ${aplicados}, fallaron ${errores.length}`);
      } else {
        toast.success(
          `${aplicados} ${aplicados === 1 ? 'ajuste aplicado' : 'ajustes aplicados'}`,
        );
      }
      router.push('/inventario');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo aplicar el recuento');
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/inventario" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Recuento de stock</h1>
          <p className="text-sm text-muted-foreground">
            Anotá lo que contaste. Lo que dejes vacío no se toca.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Productos</CardTitle>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtrados.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay productos para contar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Sistema</TableHead>
                    <TableHead className="w-32">Contado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((p) => {
                    const raw = contado[p.id];
                    const hayValor = raw !== undefined && raw !== '';
                    const delta = hayValor ? Number(raw) - p.stockActual : 0;

                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="font-medium">{p.nombre}</span>
                          <span className="block text-xs text-muted-foreground">
                            #{p.codigo}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCantidad(p.stockActual, p.unidad)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              placeholder="—"
                              value={raw ?? ''}
                              onChange={(e) =>
                                setContado((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="h-9"
                            />
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {abrevUnidad(p.unidad)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {!hayValor || delta === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={
                                delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {delta > 0 ? '+' : ''}
                              {delta}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Con diferencia</span>
                <span className="font-medium tabular-nums">{diferencias.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impacto a costo</span>
                <span
                  className={
                    impactoValorizado >= 0
                      ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                      : 'font-medium tabular-nums text-rose-600 dark:text-rose-400'
                  }
                >
                  {formatCurrency(impactoValorizado)}
                </span>
              </div>
              {diferencias.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Cada diferencia queda registrada en el historial del producto.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Motivo *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={motivo}
                onValueChange={(v) => setMotivo((v as MotivoAjuste) ?? 'recuento')}
                disabled={guardando}
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
              <div className="space-y-2">
                <Label htmlFor="detalle">Aclaración</Label>
                <Input
                  id="detalle"
                  placeholder="Opcional"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={guardando || diferencias.length === 0}
            onClick={aplicar}
          >
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : diferencias.length === 0 ? (
              'Sin diferencias'
            ) : (
              `Aplicar ${diferencias.length} ${diferencias.length === 1 ? 'ajuste' : 'ajustes'}`
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}
