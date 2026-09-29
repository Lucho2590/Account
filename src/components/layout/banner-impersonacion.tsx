'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getEmpresa } from '@/lib/firebase-db';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { RUTA_SUPER_INICIO } from './nav-items';

/**
 * Aviso permanente de que lo que estás viendo no es tuyo.
 *
 * Es deliberadamente intrusivo: el superusuario puede escribir en cualquier
 * empresa, y nada en los datos distingue después una carga suya de una del
 * cliente. La única defensa contra tocar la empresa equivocada es que en todo
 * momento se vea cuál está abierta.
 */
export function BannerImpersonacion() {
  const { esSuper, empresaImpersonada, salirDeImpersonacion } = useAuth();
  const router = useRouter();
  // Se guarda junto al id que se resolvió, y el nombre se deriva comparando
  // contra la empresa actual. Así, al cambiar de empresa, no hace falta
  // limpiar el estado dentro del efecto (y no queda el nombre anterior
  // colgado un instante mientras carga el nuevo).
  const [resuelta, setResuelta] = useState<{ id: string; nombre: string } | null>(null);
  const nombre = resuelta?.id === empresaImpersonada ? resuelta.nombre : null;

  useEffect(() => {
    if (!empresaImpersonada) return;
    let cancelado = false;

    getEmpresa(empresaImpersonada)
      .then((e) => {
        if (!cancelado && e) setResuelta({ id: e.id, nombre: e.nombre });
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [empresaImpersonada]);

  if (!esSuper || !empresaImpersonada) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
      <Eye className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Estás dentro de <strong>{nombre ?? 'una empresa'}</strong> como superusuario.
        Lo que cargues queda en su cuenta.
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-amber-900 hover:bg-amber-200 dark:text-amber-100"
        onClick={() => {
          salirDeImpersonacion();
          router.replace(RUTA_SUPER_INICIO);
        }}
      >
        <X className="mr-1 h-4 w-4" />
        Salir
      </Button>
    </div>
  );
}
