'use client';

import { useEffect, useState } from 'react';
import { Proveedor } from '@/types';
import { getProveedores, deleteProveedor } from '@/lib/firebase-db';
import { ProveedoresTable } from '@/components/proveedores/proveedores-table';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProveedores();
  }, []);

  async function loadProveedores() {
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error('Error loading proveedores:', error);
      toast.error('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProveedor(id);
      setProveedores(proveedores.filter((p) => p.id !== id));
      toast.success('Proveedor eliminado correctamente');
    } catch (error) {
      console.error('Error deleting proveedor:', error);
      toast.error('Error al eliminar el proveedor');
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
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <p className="text-muted-foreground">Gestiona los proveedores de tu distribuidora</p>
      </div>

      <ProveedoresTable proveedores={proveedores} onDelete={handleDelete} />
    </div>
  );
}
