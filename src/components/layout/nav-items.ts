import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Wallet,
  FileText,
  ShoppingCart,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: 'General',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
      { title: 'Cuentas', href: '/cuentas', icon: Wallet },
      { title: 'Reportes', href: '/reportes', icon: FileText },
    ],
  },
  {
    label: 'Operaciones',
    items: [{ title: 'Ventas', href: '/ventas', icon: ShoppingCart }],
  },
  {
    label: 'Entidades',
    items: [
      { title: 'Proveedores', href: '/proveedores', icon: Truck },
      { title: 'Clientes', href: '/clientes', icon: Users },
    ],
  },
  {
    label: 'Catálogo',
    items: [{ title: 'Productos', href: '/productos', icon: Package }],
  },
];

export const bottomNavItems: NavItem[] = [
  { title: 'Inicio', href: '/', icon: LayoutDashboard, exact: true },
  { title: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { title: 'Cuentas', href: '/cuentas', icon: Wallet },
  { title: 'Clientes', href: '/clientes', icon: Users },
];

export const moreMenuItems: NavItem[] = [
  { title: 'Proveedores', href: '/proveedores', icon: Truck },
  { title: 'Productos', href: '/productos', icon: Package },
  { title: 'Reportes', href: '/reportes', icon: FileText },
];
