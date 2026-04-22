'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProveedorForm } from '@/components/proveedores/proveedor-form';
import { ProveedorSchemaType } from '@/lib/validators';
import { addProveedor } from '@/lib/firebase-db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NuevoProveedorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: ProveedorSchemaType) {
    setIsLoading(true);
    try {
      await addProveedor(data);
      toast.success('Proveedor creado correctamente');
      router.push('/proveedores');
    } catch (error) {
      console.error('Error creating proveedor:', error);
      toast.error('Error al crear el proveedor');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/proveedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Proveedor</h1>
          <p className="text-muted-foreground">Registra un nuevo proveedor</p>
        </div>
      </div>

      <ProveedorForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Crear Proveedor" />
    </div>
  );
}
