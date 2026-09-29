'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { RolUsuario } from '@/types';

export const AUTH_COOKIE = 'auth';

// Qué empresa está mirando el superusuario. Va en localStorage para que
// sobreviva a un refresh: si no, cada recarga lo devolvería al listado.
const EMPRESA_ACTIVA_KEY = 'empresaActiva';

export interface User {
  uid: string;
  email: string;
  name: string;
  activo: boolean;
  rol: RolUsuario;
  /** null solo para el superusuario, que no pertenece a ninguna empresa. */
  empresaId: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  esSuper: boolean;
  /**
   * Empresa que el superusuario está mirando. null cuando no está
   * impersonando a nadie. Para el resto de los usuarios siempre es null: su
   * empresa sale del perfil.
   */
  empresaImpersonada: string | null;
  impersonar: (empresaId: string) => void;
  salirDeImpersonacion: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Traduce los códigos de error de Firebase Auth a mensajes que le sirvan
 * al usuario. Sin esto un problema de red se ve igual que una clave mal puesta.
 */
function mensajeDeError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email o contraseña incorrectos';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo';
    case 'auth/network-request-failed':
      return 'No se pudo conectar. Revisá tu conexión a internet';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'No se pudo iniciar sesión';
  }
}

/** Error que ya trae un mensaje listo para mostrar. */
class AuthError extends Error {}

/** El usuario existe y está activo, pero no tiene empresa asignada. */
class SinEmpresaError extends AuthError {}

/**
 * Resuelve el perfil del usuario contra la colección `usuarios` y deja
 * la cookie con el ID token lista para que `proxy.ts` pueda verificarla.
 *
 * Devuelve null si el usuario no tiene perfil o está dado de baja: en ese
 * caso cierra la sesión, porque las Firestore Rules tampoco lo van a dejar
 * leer nada.
 */
async function resolverSesion(firebaseUser: FirebaseUser): Promise<User | null> {
  const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

  if (!snap.exists() || snap.data().activo !== true) {
    await signOut(auth);
    Cookies.remove(AUTH_COOKIE);
    return null;
  }

  const data = snap.data();
  const rol: RolUsuario = data.rol ?? 'empleado';
  const empresaId: string | null = data.empresaId ?? null;

  // Un usuario que no es super y no tiene empresa asignada no puede operar:
  // las Firestore Rules no lo dejarían leer nada y quedaría en una pantalla
  // vacía. Lo tratamos igual que a uno dado de baja.
  if (rol !== 'super' && !empresaId) {
    await signOut(auth);
    Cookies.remove(AUTH_COOKIE);
    throw new SinEmpresaError(
      'Tu usuario todavía no tiene una empresa asignada. Pedile a un administrador que te asigne una.',
    );
  }

  const token = await firebaseUser.getIdToken();

  // La escribe JS, así que no puede ser httpOnly: el ID token ya vive en
  // IndexedDB del cliente, un XSS lo obtendría igual.
  Cookies.set(AUTH_COOKIE, token, {
    expires: 1,
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
  });

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? data.email ?? '',
    name: data.nombre || firebaseUser.displayName || firebaseUser.email || 'Usuario',
    activo: true,
    rol,
    empresaId,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaImpersonada, setEmpresaImpersonada] = useState<string | null>(null);

  useEffect(() => {
    // onIdTokenChanged (y no onAuthStateChanged) porque también dispara en
    // cada refresh del token, que es cuando hay que reescribir la cookie.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          Cookies.remove(AUTH_COOKIE);
          setUser(null);
          setEmpresaImpersonada(null);
          return;
        }
        const resuelto = await resolverSesion(firebaseUser);
        // Se lee acá y no en un efecto aparte para que el guard nunca vea un
        // frame intermedio de "super sin empresa" y lo rebote al listado.
        if (resuelto?.rol === 'super') {
          setEmpresaImpersonada(window.localStorage.getItem(EMPRESA_ACTIVA_KEY));
        }
        setUser(resuelto);
      } catch {
        Cookies.remove(AUTH_COOKIE);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const esSuper = user?.rol === 'super';

  const impersonar = useCallback((empresaId: string) => {
    window.localStorage.setItem(EMPRESA_ACTIVA_KEY, empresaId);
    setEmpresaImpersonada(empresaId);
  }, []);

  const salirDeImpersonacion = useCallback(() => {
    window.localStorage.removeItem(EMPRESA_ACTIVA_KEY);
    setEmpresaImpersonada(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new AuthError(mensajeDeError(error));
    }

    // Resolvemos la sesión acá mismo en vez de esperar al listener: así la
    // cookie ya existe cuando la página de login navega, y el proxy no
    // rebota el primer request al dashboard.
    const resolved = await resolverSesion(credential.user);

    if (!resolved) {
      throw new AuthError(
        'Tu usuario no está habilitado para entrar. Pedile a un administrador que lo active.',
      );
    }

    setUser(resolved);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    Cookies.remove(AUTH_COOKIE);
    window.localStorage.removeItem(EMPRESA_ACTIVA_KEY);
    setUser(null);
    setEmpresaImpersonada(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        esSuper,
        empresaImpersonada: esSuper ? empresaImpersonada : null,
        impersonar,
        salirDeImpersonacion,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * La empresa del usuario actual, para pasarle el scope a `firebase-db`.
 *
 * Solo la usan las pantallas operativas, que el guard de `DashboardLayout` ya
 * dejó pasar: si acá no hay empresa es un bug de ruteo, no un estado posible,
 * y preferimos enterarnos con un error claro antes que hacer una query contra
 * un path inválido.
 */
export function useEmpresaId(): string {
  const { user, empresaImpersonada } = useAuth();

  // Para el superusuario el scope es la empresa que está impersonando; para
  // el resto, la suya. Como todas las pantallas operativas piden la empresa
  // por acá, con esto solo alcanza para que funcionen impersonando.
  const empresaId = user?.rol === 'super' ? empresaImpersonada : user?.empresaId;

  if (!empresaId) {
    throw new Error(
      'useEmpresaId se usó sin una empresa en contexto (¿un superusuario sin empresa seleccionada?)',
    );
  }
  return empresaId;
}
