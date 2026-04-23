'use client';

import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { MobileHeader } from './mobile-header';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { loading } = useAuth();

  if (loading) {
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
        <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-28 md:p-6 md:pb-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
