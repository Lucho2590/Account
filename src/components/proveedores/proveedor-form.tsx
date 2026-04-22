'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proveedorSchema, ProveedorSchemaType } from '@/lib/validators';
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

interface ProveedorFormProps {
  defaultValues?: Partial<ProveedorSchemaType>;
  onSubmit: (data: ProveedorSchemaType) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProveedorForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Guardar',
}: ProveedorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProveedorSchemaType>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      razonSocial: '',
      cuit: '',
      direccion: {
        calle: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
      },
      telefono: '',
      email: '',
      contacto: '',
      condicionIva: 'responsable_inscripto',
      datosBancarios: {
        banco: '',
        cbu: '',
        alias: '',
      },
      activo: true,
      ...defaultValues,
    },
  });

  const condicionIva = watch('condicionIva');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razón Social *</Label>
            <Input
              id="razonSocial"
              {...register('razonSocial')}
              disabled={isLoading}
            />
            {errors.razonSocial && (
              <p className="text-sm text-destructive">{errors.razonSocial.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT *</Label>
            <Input
              id="cuit"
              placeholder="XX-XXXXXXXX-X"
              {...register('cuit')}
              disabled={isLoading}
            />
            {errors.cuit && (
              <p className="text-sm text-destructive">{errors.cuit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="condicionIva">Condición IVA *</Label>
            <Select
              value={condicionIva}
              onValueChange={(value) =>
                setValue('condicionIva', value as ProveedorSchemaType['condicionIva'])
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar condición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
              </SelectContent>
            </Select>
            {errors.condicionIva && (
              <p className="text-sm text-destructive">{errors.condicionIva.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="calle">Calle *</Label>
            <Input
              id="calle"
              {...register('direccion.calle')}
              disabled={isLoading}
            />
            {errors.direccion?.calle && (
              <p className="text-sm text-destructive">{errors.direccion.calle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad *</Label>
            <Input
              id="ciudad"
              {...register('direccion.ciudad')}
              disabled={isLoading}
            />
            {errors.direccion?.ciudad && (
              <p className="text-sm text-destructive">{errors.direccion.ciudad.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia *</Label>
            <Input
              id="provincia"
              {...register('direccion.provincia')}
              disabled={isLoading}
            />
            {errors.direccion?.provincia && (
              <p className="text-sm text-destructive">{errors.direccion.provincia.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigoPostal">Código Postal *</Label>
            <Input
              id="codigoPostal"
              {...register('direccion.codigoPostal')}
              disabled={isLoading}
            />
            {errors.direccion?.codigoPostal && (
              <p className="text-sm text-destructive">{errors.direccion.codigoPostal.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              {...register('telefono')}
              disabled={isLoading}
            />
            {errors.telefono && (
              <p className="text-sm text-destructive">{errors.telefono.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contacto">Persona de Contacto</Label>
            <Input
              id="contacto"
              {...register('contacto')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos Bancarios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Input
              id="banco"
              {...register('datosBancarios.banco')}
              disabled={isLoading}
            />
            {errors.datosBancarios?.banco && (
              <p className="text-sm text-destructive">{errors.datosBancarios.banco.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cbu">CBU *</Label>
            <Input
              id="cbu"
              placeholder="22 dígitos"
              {...register('datosBancarios.cbu')}
              disabled={isLoading}
            />
            {errors.datosBancarios?.cbu && (
              <p className="text-sm text-destructive">{errors.datosBancarios.cbu.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="alias">Alias CBU</Label>
            <Input
              id="alias"
              {...register('datosBancarios.alias')}
              disabled={isLoading}
            />
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
