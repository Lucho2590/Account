/**
 * Migración a multitenant.
 *
 * Deja la base lista para el modelo por empresa:
 *   1. Borra todo el contenido de negocio de las colecciones planas viejas.
 *   2. Marca al superusuario (rol 'super', sin empresa).
 *   3. Elimina la cuenta que quedó del login hardcodeado.
 *
 * Corre ANTES de desplegar las reglas nuevas: las reglas actuales todavía
 * permiten escribir a cualquier usuario activo, que es lo que este script
 * necesita. Si se despliegan primero, el script se queda sin permisos.
 *
 * Ejecutar con:
 *   npx tsx scripts/migrate-multitenant.ts <email-admin> <password-admin> --confirmar
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const SUPER_EMAIL = 'lopezlucianomartin@gmail.com';
const A_ELIMINAR = 'user@mdqaps.com.ar';

const COLECCIONES_NEGOCIO = [
  'clientes',
  'proveedores',
  'productos',
  'cuentas_corrientes',
  'movimientos',
  'ventas',
  'contactos',
];

const [email, password, flag] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    'Uso: npx tsx scripts/migrate-multitenant.ts <email-admin> <password-admin> --confirmar',
  );
  process.exit(1);
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  await signInWithEmailAndPassword(getAuth(app), email, password);

  // --- Inventario antes de tocar nada ---
  console.log('\nContenido actual:');
  const conteos: Record<string, number> = {};
  let total = 0;
  for (const c of COLECCIONES_NEGOCIO) {
    const snap = await getDocs(collection(db, c));
    conteos[c] = snap.size;
    total += snap.size;
    console.log(`  ${c.padEnd(20)} ${snap.size} docs`);
  }
  console.log(`  ${'TOTAL'.padEnd(20)} ${total} docs\n`);

  const usuariosSnap = await getDocs(collection(db, 'usuarios'));
  console.log('Usuarios:');
  usuariosSnap.docs.forEach((d) =>
    console.log(`  ${d.data().email} — ${d.data().nombre}`),
  );

  if (flag !== '--confirmar') {
    console.log('\n⚠️  Esto BORRA los documentos listados arriba y NO hay backup.');
    console.log('   Volvé a correrlo con --confirmar si es lo que querés.\n');
    process.exit(0);
  }

  // --- 1. Borrado del contenido de negocio ---
  console.log('\nBorrando contenido de negocio...');
  for (const c of COLECCIONES_NEGOCIO) {
    const snap = await getDocs(collection(db, c));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, c, d.id))));
    console.log(`  ✓ ${c} (${snap.size})`);
  }

  // --- 2. Superusuario ---
  const superDoc = usuariosSnap.docs.find((d) => d.data().email === SUPER_EMAIL);
  if (!superDoc) {
    throw new Error(`No encontré el usuario ${SUPER_EMAIL} en la colección usuarios`);
  }
  await updateDoc(doc(db, 'usuarios', superDoc.id), {
    rol: 'super',
    empresaId: null,
    activo: true,
    updatedAt: Timestamp.now(),
  });
  console.log(`\n  ✓ ${SUPER_EMAIL} → rol 'super', sin empresa`);

  // --- 3. Baja de la cuenta del login hardcodeado ---
  const viejo = usuariosSnap.docs.find((d) => d.data().email === A_ELIMINAR);
  if (viejo) {
    await deleteDoc(doc(db, 'usuarios', viejo.id));
    console.log(`  ✓ perfil de ${A_ELIMINAR} eliminado`);

    // La cuenta de Auth se borra a sí misma: borrar cuentas ajenas requiere
    // Admin SDK, y no lo usamos.
    if (email === A_ELIMINAR) {
      const actual = getAuth(app).currentUser;
      if (actual) {
        await deleteUser(actual);
        console.log(`  ✓ cuenta de Auth de ${A_ELIMINAR} eliminada`);
      }
    } else {
      console.log(
        `  ⚠️  La cuenta de Auth de ${A_ELIMINAR} sigue existiendo. Sin perfil no puede`,
      );
      console.log('     entrar a ningún lado. Para borrarla del todo, corré este script');
      console.log(`     logueado como ${A_ELIMINAR}, o eliminala desde la consola.`);
    }
  }

  console.log('\nListo. Próximos pasos:');
  console.log('  1. firebase deploy --only firestore:rules,firestore:indexes');
  console.log(`  2. Entrar como ${SUPER_EMAIL} y crear la primera empresa.\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error('\n✗ Error:', error.code || '', error.message || error);
  process.exit(1);
});
