'use client';

import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, TrendingDown, TrendingUp } from 'lucide-react';

export type CambioDeCosto = {
  productoId: string;
  productoNombre: string;
  costoAnterior: number;
  costoNuevo: number;
};

interface CostosDistintosProps {
  cambios: CambioDeCosto[];
  /** Ids cuyo costo se acepta pisar en la ficha del producto. */
  aceptados: string[];
  onToggle: (productoId: string) => void;
}

/**
 * Avisa cuando se está pagando un precio distinto al que tiene la ficha del
 * producto, y deja decidir producto por producto si actualizarla.
 *
 * Viene marcado por defecto: pagar otro precio normalmente significa que el
 * costo cambió. Lo que no se acepta acá no se pierde — queda registrado en la
 * recepción, solo que no pisa la ficha.
 */
export function CostosDistintos({ cambios, aceptados, onToggle }: CostosDistintosProps) {
  if (cambios.length === 0) return null;

  return (
    <Card className="border-amber-300 dark:border-amber-500/40">
      <CardHeader>
        <CardTitle className="text-base">
          {cambios.length === 1
            ? 'Un producto cambió de costo'
            : `${cambios.length} productos cambiaron de costo`}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Elegí cuáles querés actualizar en el catálogo. Cada cambio queda registrado
          en el historial del producto.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {cambios.map((c) => {
          const aceptado = aceptados.includes(c.productoId);
          const subio = c.costoNuevo > c.costoAnterior;
          const Icono = subio ? TrendingUp : TrendingDown;

          return (
            <button
              key={c.productoId}
              type="button"
              onClick={() => onToggle(c.productoId)}
              aria-pressed={aceptado}
              className={cn(
                'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
                aceptado ? 'border-primary bg-primary/5' : 'hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  aceptado ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                )}
              >
                {aceptado && <Check className="h-3.5 w-3.5" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.productoNombre}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="tabular-nums line-through">
                    {formatCurrency(c.costoAnterior)}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span
                    className={cn(
                      'tabular-nums font-medium',
                      subio
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {formatCurrency(c.costoNuevo)}
                  </span>
                </span>
              </span>

              <Icono
                className={cn(
                  'h-4 w-4 shrink-0',
                  subio
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400',
                )}
              />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
