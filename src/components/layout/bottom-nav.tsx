'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { bottomNavItems, moreMenuItems, type NavItem } from './nav-items';

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreMenuItems.some((item) => isActive(pathname, item));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {bottomNavItems.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        );
      })}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                moreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="Más opciones"
            />
          }
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Más</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-4/5 max-w-xs">
          <SheetHeader>
            <SheetTitle>Más opciones</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-1 p-2">
            {moreMenuItems.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
