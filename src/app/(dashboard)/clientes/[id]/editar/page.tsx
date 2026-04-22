'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cliente } from '@/types';
import { getCliente, updateCliente } from '@/lib/firebase-db';
import { ClienteForm } from '@/components/clientes/cliente-form';
import { ClienteSchemaType } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCliente() {
      try {
        const data = await getCliente(id);
        if (!data) {
          toast.error('Cliente no encontrado');
          router.push('/clientes');
          return;
        }
        setCliente(data);
      } catch (error) {
        console.error('Error loading cliente:', error);
        toast.error('Error al cargar el cliente');
      } finally {
        setLoading(false);
      }
    }

    loadCliente();
  }, [id, router]);

  async function handleSubmit(data: ClienteSchemaType) {
    setIsSubmitting(true);
    try {
      await updateCliente(id, data);
      toast.success('Cliente actualizado correctamente');
      router.push(`/clientes/${id}`);
    } catch (error) {
      console.error('Error updating cliente:', error);
      toast.error('Error al actualizar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clientes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">{cliente.razonSocial}</p>
        </div>
      </div>

      <ClienteForm
        defaultValues={{
          razonSocial: cliente.razonSocial,
          cuit: cliente.cuit,
          direccion: cliente.direccion,
          telefono: cliente.telefono,
          email: cliente.email,
          contacto: cliente.contacto,
          limiteCredito: cliente.limiteCredito,
          condicionIva: cliente.condicionIva,
          activo: cliente.activo,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Guardar Cambios"
      />
    </div>
  );
}
