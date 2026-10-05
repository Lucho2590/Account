'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { OrdenCompra, EstadoOrdenCompra } from '@/types';
import { formatCurrency, formatDateShort, formatEstadoOrden } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Eye, PackagePlus, Search } from 'lucide-react';

type EstadoFilter = EstadoOrdenCompra | 'todos';

const variantEstado: Record<EstadoOrdenCompra, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pendiente: 'outline',
  parcial: 'secondary',
  recibida: 'default',
  anulada: 'destructive',
};

// Base UI pinta el valor crudo ("todos") salvo que el Root reciba el mapa de
// etiquetas en `items`.
const ESTADOS = {
  todos: 'Todos los estados',
  pendiente: 'Pendientes',
  parcial: 'Recibidas en parte',
  recibida: 'Recibidas',
  anulada: 'Anuladas',
};

export function OrdenesTable({
  ordenes,
  ocultarProveedor = false,
}: {
  ordenes: OrdenCompra[];
  /** Dentro de la ficha de un proveedor la columna repetiría el mismo nombre. */
  ocultarProveedor?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoFilter>('todos');

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ordenes.filter((o) => {
      if (estado !== 'todos' && o.estado !== estado) return false;
      if (!q) return true;
      return (
        o.proveedorNombre.toLowerCase().includes(q) || String(o.numero).includes(q)
      );
    });
  }, [ordenes, search, estado]);

  const recibidoDe = (o: OrdenCompra) => {
    const pedido = o.items.reduce((s, it) => s + it.cantidad, 0);
    const recibido = o.items.reduce((s, it) => s + it.cantidadRecibida, 0);
    return `${recibido} / ${pedido}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ocultarProveedor ? 'Buscar por número...' : 'Buscar por proveedor o número...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)} items={ESTADOS}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="parcial">Recibidas en parte</SelectItem>
            <SelectItem value="recibida">Recibidas</SelectItem>
            <SelectItem value="anulada">Anuladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border bg-white py-10 text-center text-muted-foreground dark:bg-transparent">
          <PackagePlus className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {ordenes.length === 0
              ? 'Todavía no registraste compras'
              : 'No hay compras que coincidan con el filtro'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border bg-white dark:bg-transparent md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">N°</TableHead>
                  <TableHead>Fecha</TableHead>
                  {!ocultarProveedor && <TableHead>Proveedor</TableHead>}
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Recibido</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((o) => (
                  <TableRow key={o.id} className={cn(o.estado === 'anulada' && 'opacity-60')}>
                    <TableCell className="font-medium">#{o.numero}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateShort(o.fecha)}
                    </TableCell>
                    {!ocultarProveedor && <TableCell>{o.proveedorNombre}</TableCell>}
                    <TableCell>
                      {o.directa ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Directa
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Orden</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {recibidoDe(o)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantEstado[o.estado]}>{formatEstadoOrden(o.estado)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/compras/${o.id}`}
                        className="inline-flex text-muted-foreground hover:text-foreground"
                        aria-label={`Ver compra ${o.numero}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filtradas.map((o) => (
              <Link
                key={o.id}
                href={`/compras/${o.id}`}
                className={cn(
                  'rounded-md border bg-card p-3 shadow-sm',
                  o.estado === 'anulada' && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      #{o.numero}
                      {!ocultarProveedor && ` · ${o.proveedorNombre}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(o.fecha)} · recibido {recibidoDe(o)}
                    </p>
                  </div>
                  <Badge variant={variantEstado[o.estado]} className="shrink-0">
                    {formatEstadoOrden(o.estado)}
                  </Badge>
                </div>
                <p className="mt-2 text-right text-sm font-medium tabular-nums">
                  {formatCurrency(o.total)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
