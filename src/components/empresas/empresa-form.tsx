'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { empresaSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Una empresa sin usuario no le sirve a nadie: se dan de alta juntos, en un
// solo paso, para que no quede una empresa a la que nadie puede entrar.
const altaSchema = empresaSchema.extend({
  duenoNombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  duenoEmail: z.string().email('Email inválido'),
  duenoPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type AltaEmpresaData = z.infer<typeof altaSchema>;

interface EmpresaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AltaEmpresaData) => Promise<void>;
}

export function EmpresaForm({ open, onOpenChange, onSubmit }: EmpresaFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        {/* El contenido se desmonta al cerrar, así el formulario arranca
            limpio en cada apertura sin resetearlo a mano. */}
        <NuevaEmpresaForm
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
          onLoadingChange={setIsLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function NuevaEmpresaForm({
  onSubmit,
  onClose,
  onLoadingChange,
}: {
  onSubmit: (data: AltaEmpresaData) => Promise<void>;
  onClose: () => void;
  onLoadingChange: (v: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AltaEmpresaData>({
    resolver: zodResolver(altaSchema),
    defaultValues: { nombre: '', cuit: '', duenoNombre: '', duenoEmail: '', duenoPassword: '' },
  });

  const setLoading = (v: boolean) => {
    setIsLoading(v);
    onLoadingChange(v);
  };

  const submit = async (data: AltaEmpresaData) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la empresa');
    } finally {
      setLoading(false);
    }
  };

  const campo = (
    id: keyof AltaEmpresaData,
    label: string,
    type = 'text',
    autoComplete?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>
      <Input id={id} type={type} autoComplete={autoComplete} {...register(id)} disabled={isLoading} />
      {errors[id] && <p className="text-sm text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(submit)}>
      <DialogHeader>
        <DialogTitle>Nueva Empresa</DialogTitle>
        <DialogDescription>
          Se crea la empresa junto con su primer usuario, que queda como dueño y
          podrá dar de alta al resto de su equipo.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {campo('nombre', 'Razón social')}
        {campo('cuit', 'CUIT')}

        <Separator />
        <p className="text-sm font-medium">Usuario dueño</p>

        {campo('duenoNombre', 'Nombre')}
        {campo('duenoEmail', 'Email', 'email', 'off')}
        {campo('duenoPassword', 'Contraseña inicial', 'password', 'new-password')}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Empresa'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
