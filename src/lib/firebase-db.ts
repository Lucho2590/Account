import { db, firebaseConfig } from './firebase';
import { runTransaction } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  writeBatch,
  increment,
  limit as fsLimit,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';
import {
  Cliente,
  ClienteFormData,
  Proveedor,
  ProveedorFormData,
  Producto,
  ProductoFormData,
  CuentaCorriente,
  Movimiento,
  MovimientoFormData,
  TipoEntidad,
  Venta,
  VentaFormData,
  VentaItem,
  Usuario,
  UsuarioFormData,
  RolUsuario,
  Empresa,
  EmpresaFormData,
} from '@/types';

// ==================== SCOPE POR EMPRESA ====================
//
// Los datos de negocio viven en subcolecciones de `empresas/{empresaId}`, así
// que el tenant queda determinado por el path y no por un campo del documento.
// Eso hace que las Firestore Rules alcancen con mirar la ruta, y que ninguna
// query pueda devolver datos de otra empresa aunque nos olvidemos un filtro.

const col = (empresaId: string, nombre: string) =>
  collection(db, 'empresas', empresaId, nombre);

const ref = (empresaId: string, nombre: string, id: string) =>
  doc(db, 'empresas', empresaId, nombre, id);


// ==================== CLIENTES ====================

export async function addCliente(empresaId: string, data: ClienteFormData): Promise<Cliente> {
  const docRef = await addDoc(col(empresaId, 'clientes'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Crear cuenta corriente asociada
  await addDoc(col(empresaId, 'cuentas_corrientes'), {
    entidadId: docRef.id,
    tipoEntidad: 'cliente' as TipoEntidad,
    saldoActual: 0,
    limiteCredito: data.limiteCredito,
    activa: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getClientes(empresaId: string): Promise<Cliente[]> {
  const q = query(col(empresaId, 'clientes'), orderBy('razonSocial'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      razonSocial: data.razonSocial,
      cuit: data.cuit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      contacto: data.contacto || '',
      limiteCredito: data.limiteCredito,
      condicionIva: data.condicionIva,
      activo: data.activo,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Cliente;
  });
}

export async function getCliente(empresaId: string, id: string): Promise<Cliente | null> {
  const docRef = ref(empresaId, 'clientes', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    razonSocial: data.razonSocial,
    cuit: data.cuit,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email,
    contacto: data.contacto || '',
    limiteCredito: data.limiteCredito,
    condicionIva: data.condicionIva,
    activo: data.activo,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Cliente;
}

export async function updateCliente(empresaId: string, id: string, data: Partial<ClienteFormData>): Promise<void> {
  const docRef = ref(empresaId, 'clientes', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCliente(empresaId: string, id: string): Promise<void> {
  // Eliminar cliente
  await deleteDoc(ref(empresaId, 'clientes', id));

  // Eliminar cuenta corriente asociada
  const cuentaQuery = query(
    col(empresaId, 'cuentas_corrientes'),
    where('entidadId', '==', id),
    where('tipoEntidad', '==', 'cliente')
  );
  const cuentaSnapshot = await getDocs(cuentaQuery);
  const batch = writeBatch(db);

  cuentaSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

// ==================== PROVEEDORES ====================

export async function addProveedor(empresaId: string, data: ProveedorFormData): Promise<Proveedor> {
  const docRef = await addDoc(col(empresaId, 'proveedores'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Crear cuenta corriente asociada
  await addDoc(col(empresaId, 'cuentas_corrientes'), {
    entidadId: docRef.id,
    tipoEntidad: 'proveedor' as TipoEntidad,
    saldoActual: 0,
    activa: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getProveedores(empresaId: string): Promise<Proveedor[]> {
  const q = query(col(empresaId, 'proveedores'), orderBy('razonSocial'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      razonSocial: data.razonSocial,
      cuit: data.cuit,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      contacto: data.contacto || '',
      condicionIva: data.condicionIva,
      datosBancarios: data.datosBancarios,
      activo: data.activo,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Proveedor;
  });
}

export async function getProveedor(empresaId: string, id: string): Promise<Proveedor | null> {
  const docRef = ref(empresaId, 'proveedores', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    razonSocial: data.razonSocial,
    cuit: data.cuit,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email,
    contacto: data.contacto || '',
    condicionIva: data.condicionIva,
    datosBancarios: data.datosBancarios,
    activo: data.activo,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Proveedor;
}

export async function updateProveedor(empresaId: string, id: string, data: Partial<ProveedorFormData>): Promise<void> {
  const docRef = ref(empresaId, 'proveedores', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProveedor(empresaId: string, id: string): Promise<void> {
  await deleteDoc(ref(empresaId, 'proveedores', id));

  const cuentaQuery = query(
    col(empresaId, 'cuentas_corrientes'),
    where('entidadId', '==', id),
    where('tipoEntidad', '==', 'proveedor')
  );
  const cuentaSnapshot = await getDocs(cuentaQuery);
  const batch = writeBatch(db);

  cuentaSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

// ==================== PRODUCTOS ====================

export async function addProducto(empresaId: string, data: ProductoFormData): Promise<Producto> {
  const docRef = await addDoc(col(empresaId, 'productos'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getProductos(empresaId: string): Promise<Producto[]> {
  const q = query(col(empresaId, 'productos'), orderBy('nombre'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      tipo: data.tipo,
      unidad: data.unidad,
      stockActual: data.stockActual,
      stockMinimo: data.stockMinimo,
      precioCompra: data.precioCompra,
      precioVenta: data.precioVenta,
      proveedorId: data.proveedorId,
      activo: data.activo,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Producto;
  });
}

export async function getProducto(empresaId: string, id: string): Promise<Producto | null> {
  const docRef = ref(empresaId, 'productos', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    codigo: data.codigo,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    tipo: data.tipo,
    unidad: data.unidad,
    stockActual: data.stockActual,
    stockMinimo: data.stockMinimo,
    precioCompra: data.precioCompra,
    precioVenta: data.precioVenta,
    proveedorId: data.proveedorId,
    activo: data.activo,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as Producto;
}

export async function updateProducto(empresaId: string, id: string, data: Partial<ProductoFormData>): Promise<void> {
  const docRef = ref(empresaId, 'productos', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProducto(empresaId: string, id: string): Promise<void> {
  await deleteDoc(ref(empresaId, 'productos', id));
}

// ==================== CUENTAS CORRIENTES ====================

export async function getCuentasCorrientes(empresaId: string): Promise<CuentaCorriente[]> {
  const q = query(col(empresaId, 'cuentas_corrientes'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      entidadId: data.entidadId,
      tipoEntidad: data.tipoEntidad,
      saldoActual: data.saldoActual,
      limiteCredito: data.limiteCredito,
      alertaSaldo: data.alertaSaldo,
      activa: data.activa,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as CuentaCorriente;
  });
}

export async function getCuentaByEntidad(
  empresaId: string,
  entidadId: string,
  tipoEntidad: TipoEntidad
): Promise<CuentaCorriente | null> {
  const q = query(
    col(empresaId, 'cuentas_corrientes'),
    where('entidadId', '==', entidadId),
    where('tipoEntidad', '==', tipoEntidad)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    entidadId: data.entidadId,
    tipoEntidad: data.tipoEntidad,
    saldoActual: data.saldoActual,
    limiteCredito: data.limiteCredito,
    alertaSaldo: data.alertaSaldo,
    activa: data.activa,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  } as CuentaCorriente;
}

// ==================== MOVIMIENTOS ====================

/**
 * Registra un movimiento y actualiza el saldo de la cuenta.
 *
 * Va en una transacción porque son dos escrituras que tienen que pasar juntas:
 * si el movimiento se guardaba y la actualización del saldo fallaba, la cuenta
 * y su libro mayor quedaban divergentes en silencio — el peor modo de falla
 * posible en una app de cuentas corrientes. Además, leer el saldo dentro de la
 * transacción evita que dos movimientos simultáneos calculen sobre el mismo
 * `saldoAnterior` y se pisen.
 */
export async function addMovimiento(empresaId: string, data: MovimientoFormData): Promise<Movimiento> {
  const cuentaRef = ref(empresaId, 'cuentas_corrientes', data.cuentaId);
  const movimientoRef = doc(col(empresaId, 'movimientos'));

  const { saldoAnterior, saldoPosterior } = await runTransaction(db, async (tx) => {
    const cuentaSnap = await tx.get(cuentaRef);

    if (!cuentaSnap.exists()) {
      throw new Error('Cuenta corriente no encontrada');
    }

    const cuentaData = cuentaSnap.data();
    const anterior: number = cuentaData.saldoActual || 0;

    // Para clientes: debe = aumenta saldo (nos deben), haber = disminuye (nos pagan)
    // Para proveedores: debe = disminuye saldo (les debemos menos), haber = aumenta (les debemos más)
    const tipoEntidad = cuentaData.tipoEntidad as TipoEntidad;
    const posterior =
      tipoEntidad === 'cliente'
        ? data.tipo === 'debe'
          ? anterior + data.monto
          : anterior - data.monto
        : data.tipo === 'haber'
          ? anterior + data.monto
          : anterior - data.monto;

    tx.set(movimientoRef, {
      ...data,
      saldoAnterior: anterior,
      saldoPosterior: posterior,
      fecha: Timestamp.fromDate(new Date(data.fecha)),
      createdAt: Timestamp.now(),
    });

    tx.update(cuentaRef, {
      saldoActual: posterior,
      updatedAt: Timestamp.now(),
    });

    return { saldoAnterior: anterior, saldoPosterior: posterior };
  });

  return {
    id: movimientoRef.id,
    ...data,
    saldoAnterior,
    saldoPosterior,
    createdAt: new Date().toISOString(),
  };
}

export async function getMovimientosByCuenta(empresaId: string, cuentaId: string): Promise<Movimiento[]> {
  const q = query(
    col(empresaId, 'movimientos'),
    where('cuentaId', '==', cuentaId),
    orderBy('fecha', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      cuentaId: data.cuentaId,
      tipo: data.tipo,
      concepto: data.concepto,
      descripcion: data.descripcion,
      monto: data.monto,
      saldoAnterior: data.saldoAnterior,
      saldoPosterior: data.saldoPosterior,
      comprobanteNumero: data.comprobanteNumero,
      comprobanteTipo: data.comprobanteTipo,
      fecha: data.fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Movimiento;
  });
}

export async function getUltimosMovimientos(empresaId: string, limite: number = 10): Promise<Movimiento[]> {
  // El limit va en la query, no en memoria: antes traía la colección entera
  // para mostrar 10 filas, y el costo crecía con todo el historial.
  const q = query(
    col(empresaId, 'movimientos'),
    orderBy('createdAt', 'desc'),
    fsLimit(limite)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      cuentaId: data.cuentaId,
      tipo: data.tipo,
      concepto: data.concepto,
      descripcion: data.descripcion,
      monto: data.monto,
      saldoAnterior: data.saldoAnterior,
      saldoPosterior: data.saldoPosterior,
      comprobanteNumero: data.comprobanteNumero,
      comprobanteTipo: data.comprobanteTipo,
      fecha: data.fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Movimiento;
  });
}

// ==================== RESUMEN DASHBOARD ====================

export async function getResumenCuentas(empresaId: string) {
  const cuentas = await getCuentasCorrientes(empresaId);

  let totalCobrar = 0;
  let totalPagar = 0;
  let cantidadClientesDeudores = 0;
  let cantidadProveedoresAcreedores = 0;

  cuentas.forEach((cuenta) => {
    if (cuenta.tipoEntidad === 'cliente' && cuenta.saldoActual > 0) {
      totalCobrar += cuenta.saldoActual;
      cantidadClientesDeudores++;
    } else if (cuenta.tipoEntidad === 'proveedor' && cuenta.saldoActual > 0) {
      totalPagar += cuenta.saldoActual;
      cantidadProveedoresAcreedores++;
    }
  });

  return {
    totalCobrar,
    totalPagar,
    cantidadClientesDeudores,
    cantidadProveedoresAcreedores,
  };
}

export async function getAlertasStock(empresaId: string) {
  const productos = await getProductos(empresaId);

  return productos
    .filter((p) => p.activo && p.stockActual <= p.stockMinimo)
    .map((p) => ({
      productoId: p.id,
      productoNombre: p.nombre,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
    }));
}

// ==================== VENTAS ====================

function mapVentaDoc(id: string, data: Record<string, unknown>): Venta {
  const rawFecha = data.fecha as { toDate?: () => Date } | undefined;
  const rawCreated = data.createdAt as { toDate?: () => Date } | undefined;
  const rawAnulada = data.anuladaAt as { toDate?: () => Date } | undefined;
  return {
    id,
    numero: (data.numero as number) ?? 0,
    clienteId: data.clienteId as string,
    clienteNombre: (data.clienteNombre as string) || '',
    cuentaCorrienteId: data.cuentaCorrienteId as string,
    fecha: rawFecha?.toDate?.()?.toISOString() || new Date().toISOString(),
    items: (data.items as VentaItem[]) || [],
    total: (data.total as number) || 0,
    medioPago: data.medioPago as Venta['medioPago'],
    estado: (data.estado as Venta['estado']) || 'completada',
    movimientoVentaId: (data.movimientoVentaId as string) || '',
    movimientoPagoId: data.movimientoPagoId as string | undefined,
    movimientoAnulacionVentaId: data.movimientoAnulacionVentaId as string | undefined,
    movimientoAnulacionPagoId: data.movimientoAnulacionPagoId as string | undefined,
    comprobanteTipo: data.comprobanteTipo as string | undefined,
    comprobanteNumero: data.comprobanteNumero as string | undefined,
    observaciones: data.observaciones as string | undefined,
    createdAt: rawCreated?.toDate?.()?.toISOString() || new Date().toISOString(),
    anuladaAt: rawAnulada?.toDate?.()?.toISOString(),
  };
}

type EscrituraVenta = {
  data: VentaFormData;
  cliente: Cliente;
  cuentaId: string;
  numero: number;
  saldoAnterior: number;
  saldoAfterVenta: number;
  saldoFinal: number;
  ventaRef: DocumentReference;
  movVentaRef: DocumentReference;
  movPagoRef: DocumentReference | null;
  cuentaRef: DocumentReference;
};

/**
 * Las escrituras de una venta. Se extrajo para que `createVenta` se lea como
 * lo que es (validar, numerar, escribir) sin que el cuerpo de la transacción
 * ocupe cien líneas.
 */
function escribirVenta(tx: Transaction, e: EscrituraVenta) {
  const { data, cliente, cuentaId, numero } = e;

  tx.set(e.movVentaRef, {
    cuentaId,
    tipo: 'debe',
    concepto: 'venta',
    descripcion: `Venta #${numero} — ${data.items.length} item${data.items.length === 1 ? '' : 's'}`,
    monto: data.total,
    saldoAnterior: e.saldoAnterior,
    saldoPosterior: e.saldoAfterVenta,
    comprobanteTipo: data.comprobanteTipo || '',
    comprobanteNumero: data.comprobanteNumero || '',
    fecha: Timestamp.fromDate(new Date(data.fecha)),
    createdAt: Timestamp.now(),
  });

  if (e.movPagoRef) {
    const medioLabel =
      data.medioPago === 'efectivo'
        ? 'Efectivo'
        : data.medioPago === 'transferencia'
          ? 'Transferencia'
          : data.medioPago === 'tarjeta'
            ? 'Tarjeta'
            : 'Cheque';
    tx.set(e.movPagoRef, {
      cuentaId,
      tipo: 'haber',
      concepto: 'cobro',
      descripcion: `Cobro venta #${numero} (${medioLabel})`,
      monto: data.total,
      saldoAnterior: e.saldoAfterVenta,
      saldoPosterior: e.saldoAnterior,
      comprobanteTipo: data.comprobanteTipo || '',
      comprobanteNumero: data.comprobanteNumero || '',
      fecha: Timestamp.fromDate(new Date(data.fecha)),
      createdAt: Timestamp.now(),
    });
  }

  tx.update(e.cuentaRef, { saldoActual: e.saldoFinal, updatedAt: Timestamp.now() });

  tx.set(e.ventaRef, {
    numero,
    clienteId: cliente.id,
    clienteNombre: cliente.razonSocial,
    cuentaCorrienteId: cuentaId,
    fecha: Timestamp.fromDate(new Date(data.fecha)),
    items: data.items,
    total: data.total,
    medioPago: data.medioPago,
    estado: 'completada',
    movimientoVentaId: e.movVentaRef.id,
    ...(e.movPagoRef ? { movimientoPagoId: e.movPagoRef.id } : {}),
    comprobanteTipo: data.comprobanteTipo || '',
    comprobanteNumero: data.comprobanteNumero || '',
    observaciones: data.observaciones || '',
    createdAt: Timestamp.now(),
  });
}

export async function createVenta(
  empresaId: string,
  data: VentaFormData,
  cliente: Cliente,
): Promise<Venta> {
  if (data.items.length === 0) {
    throw new Error('La venta debe tener al menos un item');
  }

  const cuenta = await getCuentaByEntidad(empresaId, cliente.id, 'cliente');
  if (!cuenta) {
    throw new Error('El cliente no tiene una cuenta corriente asociada');
  }

  const ventaRef = doc(col(empresaId, 'ventas'));
  const movVentaRef = doc(col(empresaId, 'movimientos'));
  const movPagoRef =
    data.medioPago !== 'cuenta_corriente' ? doc(col(empresaId, 'movimientos')) : null;

  const cuentaRef = ref(empresaId, 'cuentas_corrientes', cuenta.id);
  const contadorRef = ref(empresaId, 'contadores', 'ventas');
  const productoRefs = data.items.map((it) => ref(empresaId, 'productos', it.productoId));

  // Todo en una transacción. Antes esto era un writeBatch con las lecturas
  // afuera, lo que abría tres agujeros: el número de venta salía de contar la
  // colección entera (costoso y con dos ventas simultáneas repetían número),
  // el stock se validaba contra una lectura vieja (se podía vender más de lo
  // que había) y el saldo se calculaba sobre un valor que otra operación podía
  // haber cambiado.
  const { numero } = await runTransaction(db, async (tx) => {
    // La API exige todas las lecturas antes de cualquier escritura.
    const [contadorSnap, cuentaSnap] = await Promise.all([
      tx.get(contadorRef),
      tx.get(cuentaRef),
    ]);
    const productosSnap = await Promise.all(productoRefs.map((r) => tx.get(r)));

    if (!cuentaSnap.exists()) {
      throw new Error('El cliente no tiene una cuenta corriente asociada');
    }

    productosSnap.forEach((snap, idx) => {
      const it = data.items[idx];
      if (!snap.exists()) {
        throw new Error(`Producto "${it.productoNombre}" no encontrado`);
      }
      const stock = (snap.data().stockActual as number) || 0;
      if (stock < it.cantidad) {
        throw new Error(
          `Stock insuficiente para "${it.productoNombre}". Disponible: ${stock}, solicitado: ${it.cantidad}`,
        );
      }
    });

    const nro = ((contadorSnap.exists() ? (contadorSnap.data().ultimoNumero as number) : 0) || 0) + 1;
    const anterior: number = cuentaSnap.data().saldoActual || 0;
    const afterVenta = anterior + data.total;
    const final = data.medioPago === 'cuenta_corriente' ? afterVenta : anterior;

    tx.set(contadorRef, { ultimoNumero: nro, updatedAt: Timestamp.now() }, { merge: true });

    data.items.forEach((it, idx) => {
      tx.update(productoRefs[idx], {
        stockActual: increment(-it.cantidad),
        updatedAt: Timestamp.now(),
      });
    });

    escribirVenta(tx, {
      data,
      cliente,
      cuentaId: cuenta.id,
      numero: nro,
      saldoAnterior: anterior,
      saldoAfterVenta: afterVenta,
      saldoFinal: final,
      ventaRef,
      movVentaRef,
      movPagoRef,
      cuentaRef,
    });

    return { numero: nro };
  });


  return {
    id: ventaRef.id,
    numero,
    clienteId: cliente.id,
    clienteNombre: cliente.razonSocial,
    cuentaCorrienteId: cuenta.id,
    fecha: new Date(data.fecha).toISOString(),
    items: data.items,
    total: data.total,
    medioPago: data.medioPago,
    estado: 'completada',
    movimientoVentaId: movVentaRef.id,
    movimientoPagoId: movPagoRef?.id,
    comprobanteTipo: data.comprobanteTipo,
    comprobanteNumero: data.comprobanteNumero,
    observaciones: data.observaciones,
    createdAt: new Date().toISOString(),
  };
}

export async function getVentas(empresaId: string): Promise<Venta[]> {
  const q = query(col(empresaId, 'ventas'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapVentaDoc(d.id, d.data()));
}

export async function getVenta(empresaId: string, id: string): Promise<Venta | null> {
  const snap = await getDoc(ref(empresaId, 'ventas', id));
  if (!snap.exists()) return null;
  return mapVentaDoc(snap.id, snap.data());
}

/**
 * Anula una venta por contra-asiento: no borra nada, agrega los movimientos
 * que revierten el efecto y devuelve el stock.
 *
 * Va en transacción y relee la venta adentro porque el chequeo de "ya está
 * anulada" era un TOCTOU: con dos clics rápidos entraban dos anulaciones, se
 * duplicaban los movimientos de reversión y el stock volvía dos veces.
 */
export async function anularVenta(empresaId: string, ventaId: string): Promise<void> {
  const ventaRef = ref(empresaId, 'ventas', ventaId);

  await runTransaction(db, async (tx) => {
    const ventaSnap = await tx.get(ventaRef);
    if (!ventaSnap.exists()) throw new Error('Venta no encontrada');

    const venta = mapVentaDoc(ventaSnap.id, ventaSnap.data());
    if (venta.estado === 'anulada') throw new Error('La venta ya está anulada');

    const cuentaRef = ref(empresaId, 'cuentas_corrientes', venta.cuentaCorrienteId);
    const cuentaSnap = await tx.get(cuentaRef);
    if (!cuentaSnap.exists()) throw new Error('Cuenta corriente no encontrada');

    const saldoAnterior = (cuentaSnap.data().saldoActual as number) || 0;

    // Reversión: siempre creamos un movimiento "haber" de ajuste que descuenta
    // la deuda de la venta original. Si hubo cobro, también uno "debe" que
    // deshace el cobro. Neto sobre cuenta corriente:
    //  - cuenta_corriente: el saldo baja en total (se revierte la deuda)
    //  - otros medios: el saldo queda igual (ambos ajustes se netean)
    const saldoAfterAnulVenta = saldoAnterior - venta.total;
    const saldoFinal =
      venta.medioPago === 'cuenta_corriente' ? saldoAfterAnulVenta : saldoAnterior;

    venta.items.forEach((it) => {
      tx.update(ref(empresaId, 'productos', it.productoId), {
        stockActual: increment(it.cantidad),
        updatedAt: Timestamp.now(),
      });
    });

    const movAnulVentaRef = doc(col(empresaId, 'movimientos'));
    tx.set(movAnulVentaRef, {
      cuentaId: venta.cuentaCorrienteId,
      tipo: 'haber',
      concepto: 'ajuste',
      descripcion: `Anulación venta #${venta.numero}`,
      monto: venta.total,
      saldoAnterior,
      saldoPosterior: saldoAfterAnulVenta,
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    let movAnulPagoId: string | undefined;
    if (venta.medioPago !== 'cuenta_corriente') {
      const movAnulPagoRef = doc(col(empresaId, 'movimientos'));
      movAnulPagoId = movAnulPagoRef.id;
      tx.set(movAnulPagoRef, {
        cuentaId: venta.cuentaCorrienteId,
        tipo: 'debe',
        concepto: 'ajuste',
        descripcion: `Anulación cobro venta #${venta.numero}`,
        monto: venta.total,
        saldoAnterior: saldoAfterAnulVenta,
        saldoPosterior: saldoAnterior,
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    }

    tx.update(cuentaRef, { saldoActual: saldoFinal, updatedAt: Timestamp.now() });

    tx.update(ventaRef, {
      estado: 'anulada',
      anuladaAt: Timestamp.now(),
      movimientoAnulacionVentaId: movAnulVentaRef.id,
      ...(movAnulPagoId ? { movimientoAnulacionPagoId: movAnulPagoId } : {}),
    });
  });
}

// ==================== USUARIOS ====================

function mapUsuario(uid: string, data: Record<string, unknown>): Usuario {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedAt = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    uid,
    email: (data.email as string) || '',
    nombre: (data.nombre as string) || '',
    activo: data.activo === true,
    rol: (data.rol as RolUsuario) || 'empleado',
    empresaId: (data.empresaId as string) ?? null,
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Sin `empresaId` lista todos los usuarios — solo el superusuario puede, y las
 * reglas lo verifican. Con `empresaId` filtra por empresa.
 *
 * Son dos ramas explícitas y no una query condicional a propósito: en Firestore
 * las reglas no filtran, así que una query capaz de devolver usuarios de otra
 * empresa falla entera en vez de devolver menos filas.
 */
export async function getUsuarios(empresaId?: string): Promise<Usuario[]> {
  const q = empresaId
    ? query(collection(db, 'usuarios'), where('empresaId', '==', empresaId), orderBy('nombre'))
    : query(collection(db, 'usuarios'), orderBy('nombre'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => mapUsuario(d.id, d.data()));
}

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  if (!snap.exists()) return null;

  return mapUsuario(snap.id, snap.data());
}

/**
 * Crea la cuenta en Firebase Auth y su perfil en `usuarios`.
 *
 * Usa una app de Firebase secundaria y efímera a propósito:
 * `createUserWithEmailAndPassword` deja logueado al usuario recién creado
 * sobre la instancia que se le pase, así que hacerlo sobre la principal
 * echaría de la sesión a quien está dando el alta.
 */
export async function addUsuario(data: UsuarioFormData): Promise<Usuario> {
  const secondary = initializeApp(firebaseConfig, `provisioning-${Date.now()}`);

  try {
    const credential = await createUserWithEmailAndPassword(
      getAuth(secondary),
      data.email,
      data.password,
    );

    const perfil = {
      email: data.email,
      nombre: data.nombre,
      activo: true,
      rol: data.rol,
      empresaId: data.empresaId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // El id del documento es el uid de Auth: las Firestore Rules resuelven
    // `usuarios/$(request.auth.uid)` directo, sin tener que buscar por campo.
    try {
      await setDoc(doc(db, 'usuarios', credential.user.uid), perfil);
    } catch (error) {
      // Si el perfil no se pudo escribir (reglas, red), la cuenta de Auth ya
      // existe y dejaría el email "en uso" sin que nadie pueda recuperarlo,
      // porque borrar cuentas ajenas necesita Admin SDK. Acá sí podemos: la
      // app secundaria está autenticada como ese mismo usuario recién creado.
      await deleteUser(credential.user).catch(() => {});
      throw error;
    }

    return {
      uid: credential.user.uid,
      email: data.email,
      nombre: data.nombre,
      activo: true,
      rol: data.rol,
      empresaId: data.empresaId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } finally {
    await deleteApp(secondary);
  }
}

/**
 * Baja lógica. No borra ni deshabilita la cuenta de Auth (eso requiere el
 * Admin SDK): el usuario puede seguir logueándose, pero las Firestore Rules
 * le niegan todos los datos y el AuthContext le cierra la sesión.
 */
export async function setUsuarioActivo(uid: string, activo: boolean): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), {
    activo,
    updatedAt: Timestamp.now(),
  });
}

export async function updateUsuario(
  uid: string,
  data: { nombre: string },
): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), {
    nombre: data.nombre,
    updatedAt: Timestamp.now(),
  });
}

export async function enviarResetPassword(email: string): Promise<void> {
  const secondary = initializeApp(firebaseConfig, `reset-${Date.now()}`);
  try {
    await sendPasswordResetEmail(getAuth(secondary), email);
  } finally {
    await deleteApp(secondary);
  }
}


// ==================== EMPRESAS ====================

function mapEmpresa(id: string, data: Record<string, unknown>): Empresa {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedAt = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    id,
    nombre: (data.nombre as string) || '',
    cuit: (data.cuit as string) || '',
    activa: data.activa !== false,
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

/** Solo el superusuario: las reglas deniegan el listado a cualquier otro. */
export async function getEmpresas(): Promise<Empresa[]> {
  const q = query(collection(db, 'empresas'), orderBy('nombre'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => mapEmpresa(d.id, d.data()));
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  const snap = await getDoc(doc(db, 'empresas', id));
  if (!snap.exists()) return null;

  return mapEmpresa(snap.id, snap.data());
}

export async function addEmpresa(data: EmpresaFormData): Promise<Empresa> {
  const docRef = await addDoc(collection(db, 'empresas'), {
    ...data,
    activa: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    ...data,
    activa: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateEmpresa(id: string, data: Partial<EmpresaFormData>): Promise<void> {
  await updateDoc(doc(db, 'empresas', id), { ...data, updatedAt: Timestamp.now() });
}

export async function setEmpresaActiva(id: string, activa: boolean): Promise<void> {
  await updateDoc(doc(db, 'empresas', id), { activa, updatedAt: Timestamp.now() });
}
