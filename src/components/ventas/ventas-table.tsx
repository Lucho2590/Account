'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Search, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatDateShort,
  formatMedioPago,
} from '@/lib/formatters';
import type { EstadoVenta, MedioPago, Venta } from '@/types';

type EstadoFilter = EstadoVenta | 'todos';
type MedioFilter = MedioPago | 'todos';

export function VentasTable({ ventas }: { ventas: Venta[] }) {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<EstadoFilter>('todos');
  const [medio, setMedio] = useState<MedioFilter>('todos');

  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      if (estado !== 'todos' && v.estado !== estado) return false;
      if (medio !== 'todos' && v.medioPago !== medio) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          v.clienteNombre.toLowerCase().includes(q) ||
          String(v.numero).includes(q) ||
          (v.comprobanteNumero || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [ventas, search, estado, medio]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número de venta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={medio} onValueChange={(v) => setMedio(v as MedioFilter)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los medios</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
            <SelectItem value="cuenta_corriente">Cuenta corriente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="completada">Completadas</SelectItem>
            <SelectItem value="anulada">Anuladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground">
          {ventas.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <ShoppingCart className="h-8 w-8 opacity-40" />
              <span>Aún no registraste ventas.</span>
            </div>
          ) : (
            'No hay ventas que coincidan con el filtro.'
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-20">N°</TableHead>
                  <TableHead className="w-[110px]">Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((v) => (
                  <TableRow key={v.id} className={cn(v.estado === 'anulada' && 'opacity-60')}>
                    <TableCell className="font-medium tabular-nums">#{v.numero}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(v.fecha)}
                    </TableCell>
                    <TableCell className="font-medium">{v.clienteNombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.items.length} {v.items.length === 1 ? 'item' : 'items'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {formatMedioPago(v.medioPago)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(v.total)}
                    </TableCell>
                    <TableCell>
                      {v.estado === 'anulada' ? (
                        <Badge variant="destructive" className="font-normal">
                          Anulada
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 font-normal text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Completada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/ventas/${v.id}`} aria-label="Ver venta">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filtradas.map((v) => (
              <Link
                key={v.id}
                href={`/ventas/${v.id}`}
                className={cn(
                  'block rounded-md border bg-card p-3 shadow-sm transition-colors active:bg-muted/60',
                  v.estado === 'anulada' && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">#{v.numero}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(v.fecha)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium">{v.clienteNombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(v.total)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.items.length} {v.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-normal">
                    {formatMedioPago(v.medioPago)}
                  </Badge>
                  {v.estado === 'anulada' ? (
                    <Badge variant="destructive" className="font-normal">
                      Anulada
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 font-normal text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Completada
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
