'use client';

import { Presentacion, UnidadBase, UNIDADES_BASE } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface PresentacionesEditorProps {
  value: Presentacion[];
  onChange: (presentaciones: Presentacion[]) => void;
  unidad: UnidadBase;
  disabled?: boolean;
}

const abrev = (u: UnidadBase) => UNIDADES_BASE.find((x) => x.value === u)?.abrev ?? u;

/**
 * Las formas en que el producto se compra y se vende: "1 caja = 5 kg".
 *
 * El factor cuelga del producto y no es global a propósito: así un balde de
 * 20 litros de pintura y uno de 1 kg de grasa conviven sin pisarse.
 */
export function PresentacionesEditor({
  value,
  onChange,
  unidad,
  disabled,
}: PresentacionesEditorProps) {
  const agregar = () =>
    onChange([
      ...value,
      { id: `p${Date.now()}${value.length}`, nombre: '', factor: 1 },
    ]);

  const actualizar = (idx: number, patch: Partial<Presentacion>) =>
    onChange(value.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const quitar = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Sin presentaciones: se compra y se vende de a {abrev(unidad)}.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((p, idx) => (
            <div key={p.id} className="flex items-end gap-2 rounded-md border p-3">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                <Input
                  placeholder="Ej: Caja, Balde, Bolsa"
                  value={p.nombre}
                  onChange={(e) => actualizar(idx, { nombre: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div className="w-32 space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Equivale a ({abrev(unidad)})
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  inputMode="decimal"
                  value={p.factor}
                  onChange={(e) => actualizar(idx, { factor: Number(e.target.value) || 0 })}
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => quitar(idx)}
                disabled={disabled}
                aria-label={`Quitar ${p.nombre || 'presentación'}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <ul className="space-y-0.5 pl-1 text-xs text-muted-foreground">
            {value
              .filter((p) => p.nombre && p.factor > 0)
              .map((p) => (
                <li key={p.id}>
                  1 {p.nombre.toLowerCase()} = {p.factor} {abrev(unidad)}
                </li>
              ))}
          </ul>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={agregar} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar presentación
      </Button>
    </div>
  );
}
