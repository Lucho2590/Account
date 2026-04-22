/**
 * Script para generar datos de demostración
 * Ejecutar con: npm run seed
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// Configuración de Firebase (usar las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helpers
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomCuit = () => `20-${randomInt(10000000, 99999999)}-${randomInt(0, 9)}`;
const randomCbu = () => Array.from({ length: 22 }, () => randomInt(0, 9)).join('');
const randomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString();
};

// Datos de ejemplo
const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofía', 'Martín', 'Lucía'];
const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Fernández', 'Romero', 'Torres'];
const empresas = [
  'Distribuidora Norte SRL',
  'Comercial del Sur SA',
  'Alimentos Premium SA',
  'Supermercados Unidos',
  'Mayorista Central',
  'Importadora del Este',
  'Frigorífico Pampeano',
  'Bebidas del Litoral',
  'Lácteos Argentinos SA',
  'Panadería Industrial SRL',
];
const proveedoresNombres = [
  'Molinos Río de la Plata',
  'Arcor SAIC',
  'Mastellone Hnos',
  'Ledesma SAAI',
  'Quilmes SAICA',
];
const calles = ['Av. Corrientes', 'Av. Santa Fe', 'Calle San Martín', 'Av. Rivadavia', 'Calle Belgrano', 'Av. Córdoba', 'Calle Mitre', 'Av. Libertador'];
const ciudades = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Tucumán', 'Salta'];
const provincias = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Buenos Aires', 'Buenos Aires', 'Tucumán', 'Salta'];
const bancos = ['Banco Nación', 'Banco Provincia', 'Banco Galicia', 'Banco Santander', 'BBVA', 'Banco Macro'];

const productos = [
  { nombre: 'Harina 000 x 50kg', tipo: 'materia_prima', unidad: 'bolsa', precioCompra: 15000, precioVenta: 18000 },
  { nombre: 'Azúcar x 50kg', tipo: 'materia_prima', unidad: 'bolsa', precioCompra: 25000, precioVenta: 30000 },
  { nombre: 'Aceite Girasol x 900ml', tipo: 'venta', unidad: 'unidad', precioCompra: 1200, precioVenta: 1600 },
  { nombre: 'Arroz Largo Fino x 1kg', tipo: 'venta', unidad: 'paquete', precioCompra: 800, precioVenta: 1100 },
  { nombre: 'Fideos Secos x 500g', tipo: 'venta', unidad: 'paquete', precioCompra: 450, precioVenta: 650 },
  { nombre: 'Leche Entera x 1L', tipo: 'venta', unidad: 'sachet', precioCompra: 600, precioVenta: 850 },
  { nombre: 'Yerba Mate x 1kg', tipo: 'venta', unidad: 'paquete', precioCompra: 2500, precioVenta: 3200 },
  { nombre: 'Galletitas Dulces x 300g', tipo: 'venta', unidad: 'paquete', precioCompra: 400, precioVenta: 580 },
  { nombre: 'Tomate Triturado x 520g', tipo: 'venta', unidad: 'lata', precioCompra: 350, precioVenta: 500 },
  { nombre: 'Mayonesa x 500g', tipo: 'venta', unidad: 'frasco', precioCompra: 1100, precioVenta: 1450 },
  { nombre: 'Gaseosa Cola x 2.25L', tipo: 'venta', unidad: 'botella', precioCompra: 1800, precioVenta: 2300 },
  { nombre: 'Agua Mineral x 2L', tipo: 'venta', unidad: 'botella', precioCompra: 500, precioVenta: 750 },
  { nombre: 'Cerveza Lager x 1L', tipo: 'venta', unidad: 'botella', precioCompra: 1200, precioVenta: 1650 },
  { nombre: 'Dulce de Leche x 400g', tipo: 'venta', unidad: 'pote', precioCompra: 900, precioVenta: 1250 },
  { nombre: 'Café Molido x 500g', tipo: 'venta', unidad: 'paquete', precioCompra: 3500, precioVenta: 4500 },
];

// Funciones para limpiar colecciones
async function clearCollection(collectionName: string) {
  console.log(`Limpiando colección: ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)));
  await Promise.all(deletePromises);
  console.log(`  - Eliminados ${snapshot.size} documentos`);
}

// Generar clientes
async function seedClientes() {
  console.log('\nGenerando clientes...');
  const clienteIds: string[] = [];

  for (let i = 0; i < 10; i++) {
    const now = new Date().toISOString();
    const cliente = {
      razonSocial: empresas[i],
      cuit: randomCuit(),
      direccion: {
        calle: `${randomItem(calles)} ${randomInt(100, 5000)}`,
        ciudad: ciudades[i % ciudades.length],
        provincia: provincias[i % provincias.length],
        codigoPostal: `${randomInt(1000, 9999)}`,
      },
      telefono: `11${randomInt(40000000, 49999999)}`,
      email: `contacto@${empresas[i].toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}.com.ar`,
      contacto: `${randomItem(nombres)} ${randomItem(apellidos)}`,
      limiteCredito: randomInt(5, 50) * 100000,
      condicionIva: randomItem(['responsable_inscripto', 'monotributo', 'consumidor_final', 'exento'] as const),
      activo: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'clientes'), cliente);
    clienteIds.push(docRef.id);
    console.log(`  + Cliente: ${cliente.razonSocial}`);
  }

  return clienteIds;
}

// Generar proveedores
async function seedProveedores() {
  console.log('\nGenerando proveedores...');
  const proveedorIds: string[] = [];

  for (let i = 0; i < 5; i++) {
    const now = new Date().toISOString();
    const proveedor = {
      razonSocial: proveedoresNombres[i],
      cuit: randomCuit(),
      direccion: {
        calle: `${randomItem(calles)} ${randomInt(100, 5000)}`,
        ciudad: randomItem(ciudades),
        provincia: randomItem(provincias),
        codigoPostal: `${randomInt(1000, 9999)}`,
      },
      telefono: `11${randomInt(50000000, 59999999)}`,
      email: `ventas@${proveedoresNombres[i].toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}.com.ar`,
      contacto: `${randomItem(nombres)} ${randomItem(apellidos)}`,
      condicionIva: randomItem(['responsable_inscripto', 'monotributo', 'exento'] as const),
      datosBancarios: {
        banco: randomItem(bancos),
        cbu: randomCbu(),
        alias: `${proveedoresNombres[i].split(' ')[0].toUpperCase()}.PAGOS`,
      },
      activo: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'proveedores'), proveedor);
    proveedorIds.push(docRef.id);
    console.log(`  + Proveedor: ${proveedor.razonSocial}`);
  }

  return proveedorIds;
}

// Generar productos
async function seedProductos(proveedorIds: string[]) {
  console.log('\nGenerando productos...');
  const productoIds: string[] = [];

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    const now = new Date().toISOString();
    const stockActual = randomInt(5, 200);
    const stockMinimo = randomInt(10, 30);

    const producto = {
      codigo: `PROD-${String(i + 1).padStart(4, '0')}`,
      nombre: p.nombre,
      descripcion: `${p.nombre} - Producto de alta calidad`,
      tipo: p.tipo,
      unidad: p.unidad,
      stockActual,
      stockMinimo,
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
      proveedorId: randomItem(proveedorIds),
      activo: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'productos'), producto);
    productoIds.push(docRef.id);
    console.log(`  + Producto: ${producto.nombre} (Stock: ${stockActual})`);
  }

  return productoIds;
}

// Generar cuentas corrientes y movimientos
async function seedCuentasYMovimientos(clienteIds: string[], proveedorIds: string[]) {
  console.log('\nGenerando cuentas corrientes y movimientos...');

  // Cuentas de clientes
  for (const clienteId of clienteIds) {
    const now = new Date().toISOString();
    let saldo = 0;

    const cuenta = {
      entidadId: clienteId,
      tipoEntidad: 'cliente' as const,
      saldoActual: 0,
      limiteCredito: randomInt(5, 50) * 100000,
      activa: true,
      createdAt: now,
      updatedAt: now,
    };

    const cuentaRef = await addDoc(collection(db, 'cuentas_corrientes'), cuenta);

    // Generar entre 3 y 8 movimientos por cuenta
    const numMovimientos = randomInt(3, 8);
    for (let i = 0; i < numMovimientos; i++) {
      const esVenta = Math.random() > 0.4;
      const monto = randomInt(10, 500) * 1000;
      const saldoAnterior = saldo;

      if (esVenta) {
        saldo += monto; // Venta aumenta el saldo a cobrar
      } else {
        saldo -= monto; // Cobro disminuye
      }

      const movimiento = {
        cuentaId: cuentaRef.id,
        tipo: esVenta ? 'debe' : 'haber',
        concepto: esVenta ? 'venta' : 'cobro',
        descripcion: esVenta
          ? `Factura A ${randomInt(1, 999).toString().padStart(4, '0')}-${randomInt(1, 99999999).toString().padStart(8, '0')}`
          : `Recibo ${randomInt(1, 9999).toString().padStart(4, '0')}`,
        monto,
        saldoAnterior,
        saldoPosterior: saldo,
        fecha: randomDate(60),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'movimientos'), movimiento);
    }

    // Actualizar saldo de la cuenta
    await updateDoc(doc(db, 'cuentas_corrientes', cuentaRef.id), { saldoActual: saldo });
    console.log(`  + Cuenta cliente con ${numMovimientos} movimientos, saldo: $${saldo.toLocaleString()}`);
  }

  // Cuentas de proveedores
  for (const proveedorId of proveedorIds) {
    const now = new Date().toISOString();
    let saldo = 0;

    const cuenta = {
      entidadId: proveedorId,
      tipoEntidad: 'proveedor' as const,
      saldoActual: 0,
      activa: true,
      createdAt: now,
      updatedAt: now,
    };

    const cuentaRef = await addDoc(collection(db, 'cuentas_corrientes'), cuenta);

    // Generar entre 2 y 5 movimientos por cuenta
    const numMovimientos = randomInt(2, 5);
    for (let i = 0; i < numMovimientos; i++) {
      const esCompra = Math.random() > 0.3;
      const monto = randomInt(50, 800) * 1000;
      const saldoAnterior = saldo;

      if (esCompra) {
        saldo += monto; // Compra aumenta lo que debemos
      } else {
        saldo -= monto; // Pago disminuye
      }

      const movimiento = {
        cuentaId: cuentaRef.id,
        tipo: esCompra ? 'debe' : 'haber',
        concepto: esCompra ? 'compra' : 'pago',
        descripcion: esCompra
          ? `Factura proveedor ${randomInt(1, 999).toString().padStart(4, '0')}-${randomInt(1, 99999999).toString().padStart(8, '0')}`
          : `Orden de pago ${randomInt(1, 999).toString().padStart(4, '0')}`,
        monto,
        saldoAnterior,
        saldoPosterior: saldo,
        fecha: randomDate(60),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'movimientos'), movimiento);
    }

    // Actualizar saldo de la cuenta
    await updateDoc(doc(db, 'cuentas_corrientes', cuentaRef.id), { saldoActual: saldo });
    console.log(`  + Cuenta proveedor con ${numMovimientos} movimientos, saldo: $${saldo.toLocaleString()}`);
  }
}

// Ejecutar seed
async function main() {
  console.log('========================================');
  console.log('  GENERADOR DE DATOS DE DEMOSTRACIÓN');
  console.log('========================================\n');

  try {
    // Limpiar colecciones existentes
    console.log('Limpiando datos existentes...');
    await clearCollection('clientes');
    await clearCollection('proveedores');
    await clearCollection('productos');
    await clearCollection('cuentas_corrientes');
    await clearCollection('movimientos');

    // Generar nuevos datos
    const clienteIds = await seedClientes();
    const proveedorIds = await seedProveedores();
    await seedProductos(proveedorIds);
    await seedCuentasYMovimientos(clienteIds, proveedorIds);

    console.log('\n========================================');
    console.log('  DATOS GENERADOS EXITOSAMENTE');
    console.log('========================================');
    console.log('\nResumen:');
    console.log('  - 10 Clientes');
    console.log('  - 5 Proveedores');
    console.log('  - 15 Productos');
    console.log('  - 15 Cuentas corrientes con movimientos');
    console.log('\n¡Listo! Refrescá la app para ver los datos.');

  } catch (error) {
    console.error('\nError al generar datos:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
