'use client';

import { useEffect, useState } from 'react';
import { Usuario } from '@/types';
import {
  getUsuarios,
  addUsuario,
  setUsuarioActivo,
  enviarResetPassword,
} from '@/lib/firebase-db';
import { UsuariosTable } from '@/components/usuarios/usuarios-table';
import { UsuarioForm } from '@/components/usuarios/usuario-form';
import { useAuth, useEmpresaId } from '@/contexts/AuthContext';
import { UsuarioSchemaType } from '@/lib/validators';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function UsuariosPage() {
  const empresaId = useEmpresaId();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const data = await getUsuarios(empresaId);
        if (!cancelado) setUsuarios(data);
      } catch (error) {
        console.error('Error loading usuarios:', error);
        if (!cancelado) toast.error('Error al cargar los usuarios');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  async function handleCreate(data: UsuarioSchemaType) {
    // Los errores se propagan a propósito: el diálogo los muestra en línea
    // (email ya en uso, contraseña débil) y se queda abierto.
    const nuevo = await addUsuario({ ...data, empresaId });
    setUsuarios((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    toast.success(`Usuario ${nuevo.nombre} creado correctamente`);
  }

  async function handleToggleActivo(usuario: Usuario) {
    const activo = !usuario.activo;
    try {
      await setUsuarioActivo(usuario.uid, activo);
      setUsuarios((prev) =>
        prev.map((u) => (u.uid === usuario.uid ? { ...u, activo } : u)),
      );
      toast.success(activo ? 'Usuario activado' : 'Usuario desactivado');
    } catch (error) {
      console.error('Error updating usuario:', error);
      toast.error('Error al actualizar el usuario');
    }
  }

  async function handleResetPassword(usuario: Usuario) {
    try {
      await enviarResetPassword(usuario.email);
      toast.success(`Mail de restablecimiento enviado a ${usuario.email}`);
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('No se pudo enviar el mail de restablecimiento');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">
          Gestioná quién puede entrar al sistema
        </p>
      </div>

      <UsuariosTable
        usuarios={usuarios}
        currentUid={user?.uid}
        onToggleActivo={handleToggleActivo}
        onResetPassword={handleResetPassword}
        onNuevo={() => setFormOpen(true)}
      />

      <UsuarioForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
