'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { MobileHeader } from './mobile-header';
import { useAuth } from '@/contexts/AuthContext';
import { BannerImpersonacion } from './banner-impersonacion';
import { RUTA_SUPER_INICIO } from './nav-items';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, esSuper, empresaImpersonada } = useAuth();
  const router = useRouter();

  // El panel de administración vive en su propio route group con su propio
  // shell, así que acá solo queda un caso: un superusuario sin empresa
  // seleccionada no tiene nada que hacer en las pantallas operativas, porque
  // no sabrían qué datos pedir.
  const rutaEquivocada = !!user && esSuper && !empresaImpersonada;

  // El proxy valida la cookie, pero la sesión de Firebase vive aparte (en
  // IndexedDB). Si esa se cae o el usuario es dado de baja mientras tiene la
  // app abierta, nos quedaríamos acá sin datos y con errores en pantalla en
  // lugar de volver al login.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (rutaEquivocada) {
      router.replace(RUTA_SUPER_INICIO);
    }
  }, [rutaEquivocada, router]);

  if (loading || !user || rutaEquivocada) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar />
      <MobileHeader />
      <main className="flex-1 md:overflow-y-auto">
        <BannerImpersonacion />
        <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-28 md:p-6 md:pb-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
