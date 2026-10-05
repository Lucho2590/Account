'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Producto } from '@/types';
import { getProducto, updateProducto } from '@/lib/firebase-db';
import { ProductoForm } from '@/components/productos/producto-form';
import { ProductoSchemaType } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresaId } from '@/contexts/AuthContext';

export default function EditarProductoPage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const productoData = await getProducto(empresaId, id);

        if (!productoData) {
          toast.error('Producto no encontrado');
          router.push('/productos');
          return;
        }

        setProducto(productoData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, router, empresaId]);

  async function handleSubmit(data: ProductoSchemaType) {
    setIsSubmitting(true);
    try {
      await updateProducto(empresaId, id, data);
      toast.success('Producto actualizado correctamente');
      router.push('/productos');
    } catch (error) {
      console.error('Error updating producto:', error);
      toast.error('Error al actualizar el producto');
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

  if (!producto) {
    return null;
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
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground">{producto.nombre}</p>
        </div>
      </div>

      <ProductoForm
        defaultValues={{
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          tipo: producto.tipo,
          unidad: producto.unidad,
          presentaciones: producto.presentaciones,
          stockActual: producto.stockActual,
          stockMinimo: producto.stockMinimo,
          precioCompra: producto.precioCompra,
          precioVenta: producto.precioVenta,
          activo: producto.activo,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        permitirStockInicial={false}
        submitLabel="Guardar cambios"
        onCancel={() => router.push(`/productos/${id}`)}
      />
    </div>
  );
}
