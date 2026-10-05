'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LineaInventario } from '@/types';
import { getInventario } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { formatCantidad } from '@/lib/presentaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  Package,
  Search,
  Wallet,
} from 'lucide-react';

export default function InventarioPage() {
  const empresaId = useEmpresaId();
  const [lineas, setLineas] = useState<LineaInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const data = await getInventario(empresaId);
        if (!cancelado) setLineas(data);
      } catch (error) {
        console.error('Error loading inventario:', error);
        if (!cancelado) toast.error('Error al cargar el inventario');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  const totales = useMemo(
    () => ({
      productos: lineas.length,
      valor: lineas.reduce((s, l) => s + l.valorizado, 0),
      bajoMinimo: lineas.filter((l) => l.bajoMinimo).length,
      sinStock: lineas.filter((l) => l.producto.stockActual <= 0).length,
    }),
    [lineas],
  );

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lineas.filter((l) => {
      if (soloBajoMinimo && !l.bajoMinimo) return false;
      if (!q) return true;
      return (
        l.producto.nombre.toLowerCase().includes(q) ||
        l.producto.codigo.toLowerCase().includes(q)
      );
    });
  }, [lineas, search, soloBajoMinimo]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Qué tenés, cuánto vale y qué hay que reponer
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/inventario/recuento">
            <ClipboardCheck className="h-4 w-4" />
            Hacer recuento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Productos" value={totales.productos} icon={Package} />
        <KpiCard
          label="Valorizado a costo"
          value={formatCurrency(totales.valor)}
          sub="Stock por precio de compra"
          icon={Wallet}
          tone="neutral"
        />
        <KpiCard
          label="Bajo mínimo"
          value={totales.bajoMinimo}
          sub="Conviene reponer"
          icon={AlertTriangle}
          tone={totales.bajoMinimo > 0 ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Sin stock"
          value={totales.sinStock}
          icon={Package}
          tone={totales.sinStock > 0 ? 'negative' : 'neutral'}
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Existencias</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={soloBajoMinimo ? 'default' : 'outline'}
              onClick={() => setSoloBajoMinimo((v) => !v)}
              aria-pressed={soloBajoMinimo}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Bajo mínimo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Package className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                {lineas.length === 0
                  ? 'Todavía no cargaste productos'
                  : 'No hay productos que coincidan'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Valorizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtradas.map((l) => (
                      <TableRow key={l.producto.id}>
                        <TableCell>
                          <Link
                            href={`/productos/${l.producto.id}`}
                            className="font-medium hover:underline"
                          >
                            {l.producto.nombre}
                          </Link>
                          <span className="block text-xs text-muted-foreground">
                            #{l.producto.codigo}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={l.bajoMinimo ? 'text-amber-600 dark:text-amber-400' : ''}>
                            {formatCantidad(l.producto.stockActual, l.producto.unidad)}
                          </span>
                          {l.bajoMinimo && (
                            <Badge variant="secondary" className="ml-2">
                              Reponer
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCantidad(l.producto.stockMinimo, l.producto.unidad)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(l.producto.precioCompra)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(l.valorizado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4}>Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(filtradas.reduce((s, l) => s + l.valorizado, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              <div className="flex flex-col gap-2 md:hidden">
                {filtradas.map((l) => (
                  <Link
                    key={l.producto.id}
                    href={`/productos/${l.producto.id}`}
                    className="rounded-md border bg-card p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">#{l.producto.codigo}</p>
                      </div>
                      {l.bajoMinimo && <Badge variant="secondary">Reponer</Badge>}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className={l.bajoMinimo ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {formatCantidad(l.producto.stockActual, l.producto.unidad)}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(l.valorizado)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
