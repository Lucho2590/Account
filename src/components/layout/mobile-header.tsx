'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeftRight, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

export function MobileHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ArrowLeftRight className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Account Control</span>
          <span className="text-[10px] text-muted-foreground">Cuentas corrientes</span>
        </div>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Cuenta"
            />
          }
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {initial}
          </span>
        </SheetTrigger>
        <SheetContent side="right" className="w-4/5 max-w-xs">
          <SheetHeader>
            <SheetTitle>Tu cuenta</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            {user && (
              <div className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </Button>
            {!user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Sin sesión activa</span>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
