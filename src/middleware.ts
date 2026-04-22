import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const isAuthPage = request.nextUrl.pathname === '/login';

  // Si no está autenticado y no está en la página de login, redirigir
  if (!authCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si está autenticado y está en la página de login, redirigir al dashboard
  if (authCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar las rutas que queremos proteger
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
