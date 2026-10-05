'use client';

import { useEffect, useState } from 'react';
import { Proveedor, Producto, ItemCatalogo } from '@/types';
import { getProveedores, getProductos, getCatalogoCompleto } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { CompraForm } from '@/components/compras/compra-form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const empresaId = useEmpresaId();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const [prov, prod, cat] = await Promise.all([
          getProveedores(empresaId),
          getProductos(empresaId),
          getCatalogoCompleto(empresaId),
        ]);
        if (!cancelado) {
          setProveedores(prov);
          setProductos(prod);
          setCatalogo(cat);
        }
      } catch (error) {
        console.error('Error loading datos:', error);
        if (!cancelado) toast.error('Error al cargar proveedores y productos');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <CompraForm proveedores={proveedores} productos={productos} catalogo={catalogo} modo="orden" />;
}
