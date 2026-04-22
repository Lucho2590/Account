'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Proveedor } from '@/types';
import { getProveedor, updateProveedor } from '@/lib/firebase-db';
import { ProveedorForm } from '@/components/proveedores/proveedor-form';
import { ProveedorSchemaType } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditarProveedorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProveedor() {
      try {
        const data = await getProveedor(id);
        if (!data) {
          toast.error('Proveedor no encontrado');
          router.push('/proveedores');
          return;
        }
        setProveedor(data);
      } catch (error) {
        console.error('Error loading proveedor:', error);
        toast.error('Error al cargar el proveedor');
      } finally {
        setLoading(false);
      }
    }

    loadProveedor();
  }, [id, router]);

  async function handleSubmit(data: ProveedorSchemaType) {
    setIsSubmitting(true);
    try {
      await updateProveedor(id, data);
      toast.success('Proveedor actualizado correctamente');
      router.push(`/proveedores/${id}`);
    } catch (error) {
      console.error('Error updating proveedor:', error);
      toast.error('Error al actualizar el proveedor');
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

  if (!proveedor) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/proveedores/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Proveedor</h1>
          <p className="text-muted-foreground">{proveedor.razonSocial}</p>
        </div>
      </div>

      <ProveedorForm
        defaultValues={{
          razonSocial: proveedor.razonSocial,
          cuit: proveedor.cuit,
          direccion: proveedor.direccion,
          telefono: proveedor.telefono,
          email: proveedor.email,
          contacto: proveedor.contacto,
          condicionIva: proveedor.condicionIva,
          datosBancarios: proveedor.datosBancarios,
          activo: proveedor.activo,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Guardar Cambios"
      />
    </div>
  );
}
