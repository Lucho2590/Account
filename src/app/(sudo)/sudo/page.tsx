import { redirect } from 'next/navigation';
import { RUTA_SUPER_INICIO } from '@/components/layout/nav-items';

/**
 * `/sudo` es la raíz de la zona de administrador, pero no tiene pantalla
 * propia: manda al listado de empresas. Existe para que entrar a `/sudo` a
 * mano no dé 404.
 *
 * No chequea permisos: de eso se encarga el guard de `DashboardLayout` cuando
 * aterriza en el destino.
 */
export default function SudoPage() {
  redirect(RUTA_SUPER_INICIO);
}
