'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productoSchema, ProductoSchemaType } from '@/lib/validators';
import { UNIDADES_BASE } from '@/types';
import { sugerirCodigo } from '@/lib/codigos';
import { abrevUnidad } from '@/lib/presentaciones';
import { PresentacionesEditor } from './presentaciones-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const TIPOS = {
  venta: 'Producto de venta',
  materia_prima: 'Materia prima',
};

const UNIDADES = Object.fromEntries(
  UNIDADES_BASE.map((u) => [u.value, `${u.label} (${u.abrev})`]),
);

interface ProductoFormProps {
  defaultValues?: Partial<ProductoSchemaType>;
  onSubmit: (data: ProductoSchemaType) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  /**
   * El stock solo se puede tipear al crear. Después se corrige con un ajuste,
   * que exige motivo y deja el movimiento registrado — si no, el historial
   * dejaba de reconstruir las existencias.
   */
  permitirStockInicial?: boolean;
  /**
   * Para proponer un código libre. Sin esto el código se tipea a mano, que es
   * lo que había antes: el primer campo del alta era inventar una convención.
   */
  codigosExistentes?: string[];
}

/** Campo de dinero: el `$` adelante evita tener que adivinar la moneda. */
function MoneyInput({
  id,
  disabled,
  ...rest
}: { id: string; disabled?: boolean } & React.ComponentProps<'input'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        disabled={disabled}
        className="pl-7"
        {...rest}
      />
    </div>
  );
}

export function ProductoForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar',
  onCancel,
  permitirStockInicial = true,
  codigosExistentes = [],
}: ProductoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductoSchemaType>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'venta',
      unidad: 'unidad',
      presentaciones: [],
      stockActual: 0,
      stockMinimo: 0,
      precioCompra: 0,
      precioVenta: 0,
      activo: true,
      ...defaultValues,
    },
  });

  // Mientras no lo toquen, el código sigue al nombre. Al editar ya viene uno
  // puesto y no se pisa nunca.
  const [codigoTocado, setCodigoTocado] = useState(Boolean(defaultValues?.codigo));

  const tipo = watch('tipo');
  const unidad = watch('unidad');
  const abrev = abrevUnidad(unidad);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qué es</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_180px]">
          {/* El nombre va primero: es lo único que se sabe con certeza cuando
              se arranca a cargar un producto. */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Aceite de girasol"
              {...register('nombre', {
                onChange: (e) => {
                  if (codigoTocado) return;
                  setValue('codigo', sugerirCodigo(e.target.value, codigosExistentes));
                },
              })}
              disabled={isLoading}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              placeholder="ACE-001"
              {...register('codigo', { onChange: () => setCodigoTocado(true) })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {codigoTocado ? 'Lo elegiste vos.' : 'Se arma solo con el nombre.'}
            </p>
            {errors.codigo && (
              <p className="text-sm text-destructive">{errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Opcional"
              {...register('descripcion')}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={tipo}
              onValueChange={(value) =>
                setValue('tipo', value as ProductoSchemaType['tipo'])
              }
              disabled={isLoading}
              items={TIPOS}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venta">Producto de venta</SelectItem>
                <SelectItem value="materia_prima">Materia prima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidad">Se mide en *</Label>
            <Select
              value={unidad}
              onValueChange={(v) => setValue('unidad', v as ProductoSchemaType['unidad'])}
              disabled={isLoading}
              items={UNIDADES}
            >
              <SelectTrigger id="unidad" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES_BASE.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label} ({u.abrev})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              El stock se lleva siempre en esta unidad.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo viene</CardTitle>
          <p className="text-sm text-muted-foreground">
            Las presentaciones en las que lo comprás o lo vendés: caja, balde,
            bolsa. El stock se sigue llevando en {abrev}.
          </p>
        </CardHeader>
        <CardContent>
          <PresentacionesEditor
            value={watch('presentaciones') || []}
            onChange={(p) => setValue('presentaciones', p)}
            unidad={unidad}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock y precios</CardTitle>
          <p className="text-sm text-muted-foreground">
            Todo opcional: si no lo sabés todavía, lo dejás en cero y se corrige
            con la primera compra.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {permitirStockInicial ? (
            <div className="space-y-2">
              <Label htmlFor="stockActual">Stock inicial</Label>
              <div className="relative">
                <Input
                  id="stockActual"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  className="pr-12"
                  {...register('stockActual', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {abrev}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Lo que ya tenés hoy. Queda registrado como carga inicial.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Stock</Label>
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Se corrige desde la ficha del producto, con Ajustar stock.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stockMinimo">Stock mínimo</Label>
            <div className="relative">
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="pr-12"
                {...register('stockMinimo', { valueAsNumber: true })}
                disabled={isLoading}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {abrev}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Debajo de esto aparece como faltante.
            </p>
            {errors.stockMinimo && (
              <p className="text-sm text-destructive">{errors.stockMinimo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precioCompra">Precio de compra</Label>
            <MoneyInput
              id="precioCompra"
              {...register('precioCompra', { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Por {abrev}.</p>
            {errors.precioCompra && (
              <p className="text-sm text-destructive">{errors.precioCompra.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precioVenta">Precio de venta</Label>
            <MoneyInput
              id="precioVenta"
              {...register('precioVenta', { valueAsNumber: true })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Por {abrev}.</p>
            {errors.precioVenta && (
              <p className="text-sm text-destructive">{errors.precioVenta.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
