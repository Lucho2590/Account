import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_COOKIE = 'auth';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Claves públicas con las que Google firma los ID token. Verificar contra
// ellas nos evita depender de una service account: no hay ningún secreto
// que guardar. `createRemoteJWKSet` cachea y refresca las claves solo, por
// eso se instancia a nivel módulo y no por request.
const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

async function tokenEsValido(token: string | undefined): Promise<boolean> {
  if (!token || !PROJECT_ID) return false;

  try {
    await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    return true;
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';

    // Un token vencido, firmado por otro proyecto o inventado es esperable:
    // se rechaza en silencio. Cualquier otra cosa (no se pudieron bajar las
    // claves, por ejemplo) también rechaza, pero conviene que deje rastro:
    // si no, una caída al traer el JWKS se ve igual que una sesión vencida y
    // desloguea a todo el mundo sin explicación.
    if (!code.startsWith('ERR_JWT') && !code.startsWith('ERR_JWS')) {
      console.error('[proxy] No se pudo verificar el token:', error);
    }

    return false;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthPage = request.nextUrl.pathname === '/login';
  const autenticado = await tokenEsValido(token);

  // Si no está autenticado y no está en la página de login, redirigir
  if (!autenticado && !isAuthPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Limpiamos la cookie: si llegó hasta acá es porque estaba vencida o
    // era inválida, y dejarla puesta confunde al cliente.
    if (token) response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  // Si está autenticado y está en la página de login, redirigir al dashboard
  if (autenticado && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar las rutas que queremos proteger
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)',
  ],
};
