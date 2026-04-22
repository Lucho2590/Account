'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Proveedor } from '@/types';
import { ProductoForm } from '@/components/productos/producto-form';
import { ProductoSchemaType } from '@/lib/validators';
import { addProducto, getProveedores } from '@/lib/firebase-db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NuevoProductoPage() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProveedores() {
      try {
        const data = await getProveedores();
        setProveedores(data);
      } catch (error) {
        console.error('Error loading proveedores:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProveedores();
  }, []);

  async function handleSubmit(data: ProductoSchemaType) {
    setIsSubmitting(true);
    try {
      await addProducto(data);
      toast.success('Producto creado correctamente');
      router.push('/productos');
    } catch (error) {
      console.error('Error creating producto:', error);
      toast.error('Error al crear el producto');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/productos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Producto</h1>
          <p className="text-muted-foreground">Registra un nuevo producto o materia prima</p>
        </div>
      </div>

      <ProductoForm
        proveedores={proveedores}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Crear Producto"
      />
    </div>
  );
}
