'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { navSections, type NavItem } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Account Control</span>
              <span className="text-[10px] text-muted-foreground">Cuentas corrientes</span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="p-3">
        <Button asChild className="w-full gap-2" size={collapsed ? 'icon' : 'default'}>
          <Link href="/cuentas" title={collapsed ? 'Nuevo movimiento' : undefined}>
            <Plus className="h-4 w-4" />
            {!collapsed && <span>Nuevo movimiento</span>}
          </Link>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <h3 className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </h3>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        {!collapsed && user && (
          <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-foreground',
            collapsed && 'justify-center px-0',
          )}
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
