'use client';

import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownCircle, ArrowUpCircle, Search, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatConcepto, formatCurrency, formatDateShort } from '@/lib/formatters';
import type { ConceptoMovimiento, Movimiento, TipoEntidad } from '@/types';

type ConceptoFilter = ConceptoMovimiento | 'todos';

export function MovimientosTable({
  movimientos,
  tipoEntidad,
}: {
  movimientos: Movimiento[];
  tipoEntidad: TipoEntidad;
}) {
  const [search, setSearch] = useState('');
  const [concepto, setConcepto] = useState<ConceptoFilter>('todos');

  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (concepto !== 'todos' && m.concepto !== concepto) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          m.descripcion.toLowerCase().includes(q) ||
          (m.comprobanteNumero || '').toLowerCase().includes(q) ||
          (m.comprobanteTipo || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [movimientos, search, concepto]);

  const totales = useMemo(() => {
    return filtrados.reduce(
      (acc, m) => {
        if (m.tipo === 'debe') acc.debe += m.monto;
        else acc.haber += m.monto;
        return acc;
      },
      { debe: 0, haber: 0 },
    );
  }, [filtrados]);

  const aumentaLabel = tipoEntidad === 'cliente' ? 'Le facturamos' : 'Nos facturaron';
  const disminuyeLabel = tipoEntidad === 'cliente' ? 'Cobramos' : 'Pagamos';

  const getEffect = (mov: Movimiento): 'aumenta' | 'disminuye' => {
    if (tipoEntidad === 'cliente') {
      return mov.tipo === 'debe' ? 'aumenta' : 'disminuye';
    }
    return mov.tipo === 'haber' ? 'aumenta' : 'disminuye';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar descripción o comprobante…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 sm:w-64"
            />
          </div>
          <Select value={concepto} onValueChange={(v) => setConcepto(v as ConceptoFilter)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los conceptos</SelectItem>
              {tipoEntidad === 'proveedor' ? (
                <>
                  <SelectItem value="compra">Compras</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="venta">Ventas</SelectItem>
                  <SelectItem value="cobro">Cobros</SelectItem>
                </>
              )}
              <SelectItem value="nota_credito">N. crédito</SelectItem>
              <SelectItem value="nota_debito">N. débito</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 text-xs sm:text-right">
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {aumentaLabel}
            </p>
            <p className="font-semibold tabular-nums text-rose-600">
              {formatCurrency(tipoEntidad === 'cliente' ? totales.debe : totales.haber)}
            </p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-muted-foreground">
              {disminuyeLabel}
            </p>
            <p className="font-semibold tabular-nums text-emerald-600">
              {formatCurrency(tipoEntidad === 'cliente' ? totales.haber : totales.debe)}
            </p>
          </div>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground">
          {movimientos.length === 0
            ? 'Aún no hay movimientos en esta cuenta.'
            : 'No hay movimientos que coincidan con el filtro.'}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[110px]">Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((mov) => {
                  const effect = getEffect(mov);
                  return (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateShort(mov.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {formatConcepto(mov.concepto)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm">{mov.descripcion}</span>
                          {(mov.comprobanteTipo || mov.comprobanteNumero) && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Receipt className="h-3 w-3" />
                              {mov.comprobanteTipo} {mov.comprobanteNumero}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'inline-flex items-center justify-end gap-1 text-sm font-semibold tabular-nums',
                            effect === 'aumenta' ? 'text-rose-600' : 'text-emerald-600',
                          )}
                        >
                          {effect === 'aumenta' ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          {formatCurrency(mov.monto)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatCurrency(mov.saldoPosterior)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filtrados.map((mov) => {
              const effect = getEffect(mov);
              return (
                <div key={mov.id} className="rounded-md border bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {formatConcepto(mov.concepto)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateShort(mov.fecha)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{mov.descripcion}</p>
                      {(mov.comprobanteTipo || mov.comprobanteNumero) && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Receipt className="h-3 w-3" />
                          {mov.comprobanteTipo} {mov.comprobanteNumero}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center justify-end gap-1 text-sm font-semibold tabular-nums',
                          effect === 'aumenta' ? 'text-rose-600' : 'text-emerald-600',
                        )}
                      >
                        {effect === 'aumenta' ? (
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                        )}
                        {formatCurrency(mov.monto)}
                      </span>
                      <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        Saldo {formatCurrency(mov.saldoPosterior)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
