'use client';

import { useState } from 'react';
import { Usuario, RolUsuario } from '@/types';

const etiquetaRol: Record<RolUsuario, string> = {
  super: 'Superusuario',
  dueno: 'Dueño',
  empleado: 'Empleado',
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, KeyRound, UserCheck, UserX } from 'lucide-react';

interface UsuariosTableProps {
  usuarios: Usuario[];
  currentUid?: string;
  onToggleActivo: (usuario: Usuario) => Promise<void>;
  onResetPassword: (usuario: Usuario) => Promise<void>;
  onNuevo: () => void;
}

export function UsuariosTable({
  usuarios,
  currentUid,
  onToggleActivo,
  onResetPassword,
  onNuevo,
}: UsuariosTableProps) {
  const [search, setSearch] = useState('');
  const [toggleDialog, setToggleDialog] = useState<{ open: boolean; usuario: Usuario | null }>({
    open: false,
    usuario: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const filtered = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = async () => {
    if (!toggleDialog.usuario) return;

    setIsSaving(true);
    try {
      await onToggleActivo(toggleDialog.usuario);
      setToggleDialog({ open: false, usuario: null });
    } finally {
      setIsSaving(false);
    }
  };

  const objetivo = toggleDialog.usuario;
  const vaADesactivar = objetivo?.activo === true;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="w-full sm:w-auto" onClick={onNuevo}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border bg-white py-8 text-center text-muted-foreground">
          {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((usuario) => {
                  const esVos = usuario.uid === currentUid;
                  return (
                    <TableRow key={usuario.uid}>
                      <TableCell className="font-medium">
                        {usuario.nombre}
                        {esVos && (
                          <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                        )}
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{etiquetaRol[usuario.rol]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onResetPassword(usuario)}
                            title="Enviar mail para restablecer la contraseña"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={esVos}
                            onClick={() => setToggleDialog({ open: true, usuario })}
                            title={
                              esVos
                                ? 'No podés desactivar tu propia cuenta'
                                : usuario.activo
                                  ? 'Desactivar'
                                  : 'Activar'
                            }
                          >
                            {usuario.activo ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((usuario) => {
              const esVos = usuario.uid === currentUid;
              return (
                <div key={usuario.uid} className="rounded-md border bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {usuario.nombre}
                        {esVos && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (vos)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {usuario.email} · {etiquetaRol[usuario.rol]}
                      </p>
                    </div>
                    <Badge
                      variant={usuario.activo ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onResetPassword(usuario)}
                      aria-label="Restablecer contraseña"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={esVos}
                      onClick={() => setToggleDialog({ open: true, usuario })}
                      aria-label={usuario.activo ? 'Desactivar' : 'Activar'}
                    >
                      {usuario.activo ? (
                        <UserX className="h-4 w-4 text-destructive" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={toggleDialog.open}
        onOpenChange={(open) => !isSaving && setToggleDialog({ open, usuario: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{vaADesactivar ? 'Desactivar usuario' : 'Activar usuario'}</DialogTitle>
            <DialogDescription>
              {vaADesactivar ? (
                <>
                  <strong>{objetivo?.nombre}</strong> deja de tener acceso a los datos de
                  inmediato. La cuenta no se borra: podés volver a activarla cuando quieras.
                </>
              ) : (
                <>
                  <strong>{objetivo?.nombre}</strong> vuelve a tener acceso completo al
                  sistema.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleDialog({ open: false, usuario: null })}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant={vaADesactivar ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : vaADesactivar ? 'Desactivar' : 'Activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
