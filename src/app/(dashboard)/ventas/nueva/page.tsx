'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Cliente, Producto } from '@/types';
import { getClientes, getProductos } from '@/lib/firebase-db';
import { VentaForm } from '@/components/ventas/venta-form';

export default function NuevaVentaPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cls, prods] = await Promise.all([getClientes(), getProductos()]);
        if (!cancelled) {
          setClientes(cls);
          setProductos(prods);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <VentaForm clientes={clientes} productos={productos} />;
}
