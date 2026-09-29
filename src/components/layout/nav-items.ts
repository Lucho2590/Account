import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Wallet,
  FileText,
  ShoppingCart,
  UserCog,
} from 'lucide-react';
import type { RolUsuario } from '@/types';

/**
 * Raíz de la zona de administrador. Se usa para decidir si una ruta cae
 * adentro; por eso no incluye la subruta.
 */
export const RUTA_SUPER = '/sudo';

/**
 * Adónde entra el superusuario y adónde vuelve al salir de una empresa.
 * Va directo al listado para no pasar por el redirect de `/sudo`.
 */
export const RUTA_SUPER_INICIO = `${RUTA_SUPER}/empresas`;

export type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  /** Si se omite, lo ven todos los roles operativos (dueño y empleado). */
  roles?: RolUsuario[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// El superusuario no opera: supervisa. Por eso tiene su propia navegación en
// lugar de una versión filtrada de la operativa — no le sirve casi nada de lo
// que ve un usuario de empresa.
const navOperativa: NavSection[] = [
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
  {
    label: 'Administración',
    items: [{ title: 'Usuarios', href: '/usuarios', icon: UserCog, roles: ['dueno'] }],
  },
];

const puedeVer = (item: NavItem, rol: RolUsuario) => !item.roles || item.roles.includes(rol);

/**
 * Mientras impersona, el superusuario ve exactamente el menú de un dueño de
 * esa empresa: nada del panel de administración se filtra acá. La única
 * salida es el botón del banner, que además corta la impersonación — así no
 * hay dos caminos de vuelta que se comporten distinto.
 */
export function getNavSections(rol: RolUsuario): NavSection[] {
  const efectivo: RolUsuario = rol === 'super' ? 'dueno' : rol;

  return navOperativa
    .map((s) => ({ ...s, items: s.items.filter((i) => puedeVer(i, efectivo)) }))
    .filter((s) => s.items.length > 0);
}

const bottomOperativa: NavItem[] = [
  { title: 'Inicio', href: '/', icon: LayoutDashboard, exact: true },
  { title: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { title: 'Cuentas', href: '/cuentas', icon: Wallet },
  { title: 'Clientes', href: '/clientes', icon: Users },
];

const moreOperativa: NavItem[] = [
  { title: 'Proveedores', href: '/proveedores', icon: Truck },
  { title: 'Productos', href: '/productos', icon: Package },
  { title: 'Reportes', href: '/reportes', icon: FileText },
  { title: 'Usuarios', href: '/usuarios', icon: UserCog, roles: ['dueno'] },
];

export function getBottomNavItems(rol: RolUsuario): NavItem[] {
  return bottomOperativa.filter((i) => puedeVer(i, rol === 'super' ? 'dueno' : rol));
}

export function getMoreMenuItems(rol: RolUsuario): NavItem[] {
  return moreOperativa.filter((i) => puedeVer(i, rol === 'super' ? 'dueno' : rol));
}
