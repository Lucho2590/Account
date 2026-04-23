'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { VentaItem, Producto } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

interface ItemsTableProps {
  items: VentaItem[];
  productos: Producto[];
  onUpdate: (index: number, patch: Partial<VentaItem>) => void;
  onRemove: (index: number) => void;
}

export function ItemsTable({ items, productos, onUpdate, onRemove }: ItemsTableProps) {
  const productoById = new Map(productos.map((p) => [p.id, p]));

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed py-10 text-sm text-muted-foreground">
        Todavía no agregaste productos. Buscá uno arriba para comenzar.
      </div>
    );
  }

  return (
    <>
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-32">Cantidad</TableHead>
              <TableHead className="w-36">Precio unit.</TableHead>
              <TableHead className="w-32 text-right">Subtotal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
              const prod = productoById.get(item.productoId);
              const stock = prod?.stockActual ?? 0;
              const excedeStock = prod ? item.cantidad > stock : false;

              return (
                <TableRow key={`${item.productoId}-${idx}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.productoNombre}</span>
                      <span className="text-xs text-muted-foreground">
                        #{item.productoCodigo} · Stock: {stock} {item.unidad}
                      </span>
                      {excedeStock && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          La cantidad supera el stock disponible
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => {
                        const cantidad = Number(e.target.value) || 0;
                        onUpdate(idx, {
                          cantidad,
                          subtotal: cantidad * item.precioUnitario,
                        });
                      }}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) => {
                        const precioUnitario = Number(e.target.value) || 0;
                        onUpdate(idx, {
                          precioUnitario,
                          subtotal: item.cantidad * precioUnitario,
                        });
                      }}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {items.map((item, idx) => {
          const prod = productoById.get(item.productoId);
          const stock = prod?.stockActual ?? 0;
          const excedeStock = prod ? item.cantidad > stock : false;

          return (
            <div
              key={`${item.productoId}-${idx}`}
              className="rounded-md border bg-card p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.productoNombre}</p>
                  <p className="text-[11px] text-muted-foreground">
                    #{item.productoCodigo} · Stock: {stock} {item.unidad}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(idx)}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Cantidad</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={item.cantidad}
                    onChange={(e) => {
                      const cantidad = Number(e.target.value) || 0;
                      onUpdate(idx, {
                        cantidad,
                        subtotal: cantidad * item.precioUnitario,
                      });
                    }}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Precio unit.</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={item.precioUnitario}
                    onChange={(e) => {
                      const precioUnitario = Number(e.target.value) || 0;
                      onUpdate(idx, {
                        precioUnitario,
                        subtotal: item.cantidad * precioUnitario,
                      });
                    }}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
              {excedeStock && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  Supera el stock disponible
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
