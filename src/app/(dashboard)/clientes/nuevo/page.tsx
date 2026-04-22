'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClienteForm } from '@/components/clientes/cliente-form';
import { ClienteSchemaType } from '@/lib/validators';
import { addCliente } from '@/lib/firebase-db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NuevoClientePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: ClienteSchemaType) {
    setIsLoading(true);
    try {
      await addCliente(data);
      toast.success('Cliente creado correctamente');
      router.push('/clientes');
    } catch (error) {
      console.error('Error creating cliente:', error);
      toast.error('Error al crear el cliente');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Registra un nuevo cliente</p>
        </div>
      </div>

      <ClienteForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Crear Cliente" />
    </div>
  );
}
