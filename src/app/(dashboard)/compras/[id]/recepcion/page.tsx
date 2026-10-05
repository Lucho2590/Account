'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrdenCompra, Producto } from '@/types';
import { getOrdenCompra, getProductos } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { RecepcionForm } from '@/components/compras/recepcion-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function NuevaRecepcionPage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [o, prod] = await Promise.all([
          getOrdenCompra(empresaId, id),
          getProductos(empresaId),
        ]);
        if (!o || o.estado === 'anulada' || o.estado === 'recibida') {
          if (!cancelado) {
            toast.error(
              !o ? 'Orden no encontrada' : 'Esta orden no admite más recepciones',
            );
            router.push(`/compras/${id}`);
          }
          return;
        }
        if (!cancelado) {
          setOrden(o);
          setProductos(prod);
        }
      } catch (error) {
        console.error('Error loading orden:', error);
        if (!cancelado) toast.error('Error al cargar la orden');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId, id, router]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orden) return null;

  return <RecepcionForm orden={orden} productos={productos} />;
}
