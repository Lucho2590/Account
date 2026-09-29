'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RUTA_SUPER_INICIO } from './nav-items';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Building2, LogOut, Loader2, ShieldCheck } from 'lucide-react';

interface SudoLayoutProps {
  children: React.ReactNode;
}

const items = [{ title: 'Empresas', href: RUTA_SUPER_INICIO, icon: Building2 }];

/**
 * Shell propio del panel de administrador.
 *
 * Deliberadamente NO reusa `DashboardLayout`: compartirlos hacía que, al
 * volver de una empresa, el menú lateral siguiera siendo el de esa empresa
 * (Ventas, Clientes, "Nuevo movimiento") aunque la URL ya fuera /sudo. Son
 * dos aplicaciones distintas y ahora tienen shells distintos.
 */
export function SudoLayout({ children }: SudoLayoutProps) {
  const { user, loading, esSuper, salirDeImpersonacion, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Esta zona es solo del superusuario.
  useEffect(() => {
    if (!loading && user && !esSuper) router.replace('/');
  }, [loading, user, esSuper, router]);

  // Entrar acá termina la impersonación: o administrás la plataforma o estás
  // dentro de una empresa, nunca las dos a medias. Sin esto quedaba viva una
  // empresa "activa" invisible y navegar a / te devolvía adentro sin aviso.
  //
  // Corre UNA sola vez, al montar, y de ahí el ref: si reaccionara a cada
  // cambio, al elegir una empresa desde el listado este layout todavía está
  // montado y borraría la elección antes de que la navegación ocurra.
  const yaLimpio = useRef(false);
  useEffect(() => {
    if (yaLimpio.current) return;
    yaLimpio.current = true;
    salirDeImpersonacion();
  }, [salirDeImpersonacion]);

  if (loading || !user || !esSuper) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const esActivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:h-screen md:flex-row md:overflow-hidden">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-60 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Link href={RUTA_SUPER_INICIO} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Administración</span>
              <span className="text-[10px] text-muted-foreground">Panel de plataforma</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      esActivo(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-2">
          <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">Superusuario</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </aside>

      {/* Encabezado (móvil). No hay barra inferior: una sola sección no la
          justifica, y el objetivo es que se note que esto no es la app. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link href={RUTA_SUPER_INICIO} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Administración</span>
            <span className="text-[10px] text-muted-foreground">Panel de plataforma</span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 md:overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
