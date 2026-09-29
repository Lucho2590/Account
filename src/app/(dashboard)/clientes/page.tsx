'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cliente } from '@/types';
import { getClientes, deleteCliente } from '@/lib/firebase-db';
import { ClientesTable } from '@/components/clientes/clientes-table';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useEmpresaId } from '@/contexts/AuthContext';

export default function ClientesPage() {
  const empresaId = useEmpresaId();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClientes = useCallback(async () => {
    try {
      const data = await getClientes(empresaId);
      setClientes(data);
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  async function handleDelete(id: string) {
    try {
      await deleteCliente(empresaId, id);
      setClientes(clientes.filter((c) => c.id !== id));
      toast.success('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast.error('Error al eliminar el cliente');
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
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gestiona los clientes de tu distribuidora</p>
      </div>

      <ClientesTable clientes={clientes} onDelete={handleDelete} />
    </div>
  );
}
