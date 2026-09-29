'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usuarioSchema, UsuarioSchemaType } from '@/lib/validators';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface UsuarioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UsuarioSchemaType) => Promise<void>;
}

export function UsuarioForm({ open, onOpenChange, onSubmit }: UsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent>
        {/* El contenido se desmonta al cerrar, así que el formulario arranca
            limpio en cada apertura sin necesidad de resetearlo a mano. */}
        <NuevoUsuarioForm
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
          onLoadingChange={setIsLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

interface NuevoUsuarioFormProps {
  onSubmit: (data: UsuarioSchemaType) => Promise<void>;
  onClose: () => void;
  onLoadingChange: (loading: boolean) => void;
}

function NuevoUsuarioForm({ onSubmit, onClose, onLoadingChange }: NuevoUsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioSchemaType>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { nombre: '', email: '', password: '', rol: 'empleado' },
  });

  const setLoading = (value: boolean) => {
    setIsLoading(value);
    onLoadingChange(value);
  };

  const submit = async (data: UsuarioSchemaType) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <DialogHeader>
        <DialogTitle>Nuevo Usuario</DialogTitle>
        <DialogDescription>
          Se crea la cuenta y queda habilitada para entrar. Vas a seguir en tu
          sesión: el alta no te desloguea.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register('nombre')} disabled={isLoading} />
          {errors.nombre && (
            <p className="text-sm text-destructive">{errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rol">Rol *</Label>
          <Select
            value={watch('rol')}
            onValueChange={(v) => setValue('rol', v as UsuarioSchemaType['rol'])}
            disabled={isLoading}
          >
            <SelectTrigger id="rol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empleado">Empleado — opera, no gestiona usuarios</SelectItem>
              <SelectItem value="dueno">Dueño — además gestiona los usuarios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña inicial *</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Mínimo 6 caracteres. Después puede cambiarla desde el mail de reseteo.
          </p>
        </div>
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
            'Crear Usuario'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
