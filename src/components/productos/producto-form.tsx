'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productoSchema, ProductoSchemaType } from '@/lib/validators';
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
import { Proveedor } from '@/types';

interface ProductoFormProps {
  defaultValues?: Partial<ProductoSchemaType>;
  proveedores: Proveedor[];
  onSubmit: (data: ProductoSchemaType) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProductoForm({
  defaultValues,
  proveedores,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar',
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
      stockActual: 0,
      stockMinimo: 0,
      precioCompra: 0,
      precioVenta: 0,
      proveedorId: '',
      activo: true,
      ...defaultValues,
    },
  });

  const tipo = watch('tipo');
  const proveedorId = watch('proveedorId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              {...register('codigo')}
              disabled={isLoading}
            />
            {errors.codigo && (
              <p className="text-sm text-destructive">{errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              disabled={isLoading}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venta">Producto de Venta</SelectItem>
                <SelectItem value="materia_prima">Materia Prima</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidad">Unidad de Medida *</Label>
            <Input
              id="unidad"
              placeholder="ej: unidad, kg, litro"
              {...register('unidad')}
              disabled={isLoading}
            />
            {errors.unidad && (
              <p className="text-sm text-destructive">{errors.unidad.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proveedorId">Proveedor</Label>
            <Select
              value={proveedorId || ''}
              onValueChange={(value) => setValue('proveedorId', value || undefined)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proveedor</SelectItem>
                {proveedores.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.razonSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock y Precios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stockActual">Stock Actual *</Label>
            <Input
              id="stockActual"
              type="number"
              min="0"
              step="0.01"
              {...register('stockActual', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.stockActual && (
              <p className="text-sm text-destructive">{errors.stockActual.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
            <Input
              id="stockMinimo"
              type="number"
              min="0"
              step="0.01"
              {...register('stockMinimo', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.stockMinimo && (
              <p className="text-sm text-destructive">{errors.stockMinimo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precioCompra">Precio de Compra *</Label>
            <Input
              id="precioCompra"
              type="number"
              min="0"
              step="0.01"
              {...register('precioCompra', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.precioCompra && (
              <p className="text-sm text-destructive">{errors.precioCompra.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precioVenta">Precio de Venta *</Label>
            <Input
              id="precioVenta"
              type="number"
              min="0"
              step="0.01"
              {...register('precioVenta', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.precioVenta && (
              <p className="text-sm text-destructive">{errors.precioVenta.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
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
