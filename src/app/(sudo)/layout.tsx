import { SudoLayout } from '@/components/layout/sudo-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SudoLayout>{children}</SudoLayout>;
}
