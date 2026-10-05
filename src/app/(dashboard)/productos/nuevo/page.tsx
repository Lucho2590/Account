'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductoForm } from '@/components/productos/producto-form';
import { ProductoSchemaType } from '@/lib/validators';
import { addProducto, getProductos } from '@/lib/firebase-db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEmpresaId } from '@/contexts/AuthContext';

export default function NuevoProductoPage() {
  const empresaId = useEmpresaId();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Sólo para proponer un código que no choque con los que ya hay.
  const [codigos, setCodigos] = useState<string[]>([]);

  useEffect(() => {
    if (!empresaId) return;
    getProductos(empresaId)
      .then((ps) => setCodigos(ps.map((p) => p.codigo)))
      .catch(() => setCodigos([]));
  }, [empresaId]);

  async function handleSubmit(data: ProductoSchemaType) {
    setIsSubmitting(true);
    try {
      await addProducto(empresaId, data);
      toast.success(`${data.nombre} quedó cargado`);
      router.push('/productos');
    } catch (error) {
      console.error('Error creating producto:', error);
      toast.error('Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold">Nuevo producto</h1>
          <p className="text-muted-foreground">
            Dale un nombre y listo: el resto lo podés completar después.
          </p>
        </div>
      </div>

      <ProductoForm
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Crear producto"
        onCancel={() => router.push('/productos')}
        codigosExistentes={codigos}
      />
    </div>
  );
}
