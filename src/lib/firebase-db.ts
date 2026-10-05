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
  UnidadBase,
  ItemCatalogo,
  ItemCatalogoFormData,
  Presentacion,
  OrdenCompra,
  OrdenCompraItem,
  OrdenCompraFormData,
  Recepcion,
  RecepcionItem,
  RecepcionFormData,
  CompraDirectaFormData,
  CambioCosto,
  MovimientoStock,
  OrigenStock,
  MotivoAjuste,
  LineaInventario,
  MedioPago,
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


/**
 * La unidad era texto libre antes de que fuera una lista cerrada. Esto mapea
 * lo que se haya tipeado ("Kg", "kilo", "lts") al valor canónico, para que un
 * producto viejo no abra el formulario con el selector en blanco.
 */
function normalizarUnidad(valor: unknown): UnidadBase {
  const v = String(valor ?? '').trim().toLowerCase();
  const equivalencias: Record<string, UnidadBase> = {
    u: 'unidad', un: 'unidad', unidad: 'unidad', unidades: 'unidad',
    kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
    g: 'g', gr: 'g', gramo: 'g', gramos: 'g',
    l: 'litro', lt: 'litro', lts: 'litro', litro: 'litro', litros: 'litro',
    ml: 'ml', mililitro: 'ml', mililitros: 'ml',
    m: 'metro', mt: 'metro', mts: 'metro', metro: 'metro', metros: 'metro',
  };
  return equivalencias[v] ?? 'unidad';
}

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
  const productoRef = doc(col(empresaId, 'productos'));

  await runTransaction(db, async (tx) => {
    tx.set(productoRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // El stock con el que nace el producto también es un movimiento: si no,
    // el historial no reconstruye el stock actual y arranca con un agujero.
    if (data.stockActual > 0) {
      registrarMovimientoStock(tx, empresaId, {
        productoId: productoRef.id,
        productoNombre: data.nombre,
        tipo: 'entrada',
        cantidad: data.stockActual,
        stockAnterior: 0,
        origen: 'carga_inicial',
        origenId: '',
        origenNumero: 0,
      });
    }
  });

  return {
    id: productoRef.id,
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
      unidad: normalizarUnidad(data.unidad),
      presentaciones: data.presentaciones || [],
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
    unidad: normalizarUnidad(data.unidad),
    presentaciones: data.presentaciones || [],
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

/**
 * No toca el stock a propósito.
 *
 * Editar `stockActual` a mano dejaba el historial sin explicación: el stock
 * cambiaba y los movimientos no lo reflejaban, así que el historial dejaba de
 * reconstruirlo. Para corregir existencias está `ajustarStock`, que exige un
 * motivo y deja el rastro.
 */
export async function updateProducto(
  empresaId: string,
  id: string,
  data: Partial<ProductoFormData>,
): Promise<void> {
  const { stockActual: _ignorado, ...resto } = data;
  void _ignorado;

  await updateDoc(ref(empresaId, 'productos', id), {
    ...resto,
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
      registrarMovimientoStock(tx, empresaId, {
        productoId: it.productoId,
        productoNombre: it.productoNombre,
        tipo: 'salida',
        cantidad: it.cantidad,
        stockAnterior: (productosSnap[idx].data()?.stockActual as number) || 0,
        origen: 'venta',
        origenId: ventaRef.id,
        origenNumero: nro,
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

    // Se leen para poder asentar el stock anterior en el historial. Devolver
    // stock nunca falla, así que acá no hay nada que validar.
    const productoRefs = venta.items.map((it) => ref(empresaId, 'productos', it.productoId));
    const productosSnap = await Promise.all(productoRefs.map((r) => tx.get(r)));

    const saldoAnterior = (cuentaSnap.data().saldoActual as number) || 0;

    // Reversión: siempre creamos un movimiento "haber" de ajuste que descuenta
    // la deuda de la venta original. Si hubo cobro, también uno "debe" que
    // deshace el cobro. Neto sobre cuenta corriente:
    //  - cuenta_corriente: el saldo baja en total (se revierte la deuda)
    //  - otros medios: el saldo queda igual (ambos ajustes se netean)
    const saldoAfterAnulVenta = saldoAnterior - venta.total;
    const saldoFinal =
      venta.medioPago === 'cuenta_corriente' ? saldoAfterAnulVenta : saldoAnterior;

    venta.items.forEach((it, idx) => {
      tx.update(productoRefs[idx], {
        stockActual: increment(it.cantidad),
        updatedAt: Timestamp.now(),
      });
      registrarMovimientoStock(tx, empresaId, {
        productoId: it.productoId,
        productoNombre: it.productoNombre,
        tipo: 'entrada',
        cantidad: it.cantidad,
        stockAnterior: (productosSnap[idx].data()?.stockActual as number) || 0,
        origen: 'anulacion_venta',
        origenId: ventaId,
        origenNumero: venta.numero,
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

// ==================== COMPRAS ====================
//
// La vertical espeja a Ventas, con dos diferencias que no son cosméticas:
//
//  1. El signo contable se invierte. La regla canónica vive en
//     `addMovimiento`: para un proveedor, `haber` aumenta lo que le debemos y
//     `debe` lo baja. Así que la compra es `haber` y el pago es `debe` — al
//     revés que una venta y su cobro.
//  2. El stock entra en vez de salir, y eso cambia dónde hace falta validar:
//     recibir mercadería nunca falla, pero anular una recepción sí puede, si
//     la mercadería ya se vendió.

function mapOrdenCompra(id: string, data: Record<string, unknown>): OrdenCompra {
  const fecha = data.fecha as { toDate?: () => Date } | undefined;
  const entrega = data.fechaEntregaEstimada as { toDate?: () => Date } | undefined;
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const anuladaAt = data.anuladaAt as { toDate?: () => Date } | undefined;

  return {
    id,
    numero: (data.numero as number) ?? 0,
    proveedorId: (data.proveedorId as string) || '',
    proveedorNombre: (data.proveedorNombre as string) || '',
    fecha: fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
    fechaEntregaEstimada: entrega?.toDate?.()?.toISOString(),
    items: (data.items as OrdenCompraItem[]) || [],
    total: (data.total as number) || 0,
    estado: (data.estado as OrdenCompra['estado']) || 'pendiente',
    directa: data.directa === true,
    observaciones: (data.observaciones as string) || '',
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    anuladaAt: anuladaAt?.toDate?.()?.toISOString(),
  };
}

function mapRecepcion(id: string, data: Record<string, unknown>): Recepcion {
  const fecha = data.fecha as { toDate?: () => Date } | undefined;
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const anuladaAt = data.anuladaAt as { toDate?: () => Date } | undefined;

  return {
    id,
    numero: (data.numero as number) ?? 0,
    ordenCompraId: (data.ordenCompraId as string) || '',
    ordenCompraNumero: (data.ordenCompraNumero as number) ?? 0,
    proveedorId: (data.proveedorId as string) || '',
    proveedorNombre: (data.proveedorNombre as string) || '',
    cuentaCorrienteId: (data.cuentaCorrienteId as string) || '',
    fecha: fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
    items: (data.items as RecepcionItem[]) || [],
    total: (data.total as number) || 0,
    medioPago: (data.medioPago as MedioPago) || 'cuenta_corriente',
    estado: (data.estado as Recepcion['estado']) || 'completada',
    movimientoCompraId: (data.movimientoCompraId as string) || '',
    movimientoPagoId: data.movimientoPagoId as string | undefined,
    movimientoAnulacionCompraId: data.movimientoAnulacionCompraId as string | undefined,
    movimientoAnulacionPagoId: data.movimientoAnulacionPagoId as string | undefined,
    comprobanteTipo: (data.comprobanteTipo as string) || '',
    comprobanteNumero: (data.comprobanteNumero as string) || '',
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    anuladaAt: anuladaAt?.toDate?.()?.toISOString(),
  };
}

/** Deja asentado por qué cambió el stock de un producto. */
function registrarMovimientoStock(
  tx: Transaction,
  empresaId: string,
  datos: {
    productoId: string;
    productoNombre: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
    stockAnterior: number;
    origen: OrigenStock;
    origenId: string;
    origenNumero: number;
    motivo?: MotivoAjuste;
    detalle?: string;
  },
) {
  const delta = datos.tipo === 'entrada' ? datos.cantidad : -datos.cantidad;
  tx.set(doc(col(empresaId, 'movimientos_stock')), {
    productoId: datos.productoId,
    productoNombre: datos.productoNombre,
    tipo: datos.tipo,
    cantidad: datos.cantidad,
    stockAnterior: datos.stockAnterior,
    stockPosterior: datos.stockAnterior + delta,
    origen: datos.origen,
    origenId: datos.origenId,
    origenNumero: datos.origenNumero,
    ...(datos.motivo ? { motivo: datos.motivo } : {}),
    ...(datos.detalle ? { detalle: datos.detalle } : {}),
    fecha: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
}

/** Siguiente número de una secuencia, leído dentro de la transacción. */
function siguienteNumero(snap: { exists: () => boolean; data: () => Record<string, unknown> | undefined }) {
  return ((snap.exists() ? (snap.data()?.ultimoNumero as number) : 0) || 0) + 1;
}

// -------------------- Órdenes de compra --------------------

export async function createOrdenCompra(
  empresaId: string,
  data: OrdenCompraFormData,
  proveedor: Proveedor,
): Promise<OrdenCompra> {
  if (data.items.length === 0) {
    throw new Error('La orden debe tener al menos un item');
  }

  const ordenRef = doc(col(empresaId, 'ordenes_compra'));
  const contadorRef = ref(empresaId, 'contadores', 'ordenes_compra');

  const numero = await runTransaction(db, async (tx) => {
    const contadorSnap = await tx.get(contadorRef);
    const nro = siguienteNumero(contadorSnap);

    tx.set(contadorRef, { ultimoNumero: nro, updatedAt: Timestamp.now() }, { merge: true });

    // Una orden es un pedido: no toca stock ni cuenta corriente. Eso ocurre
    // recién al recibir la mercadería.
    tx.set(ordenRef, {
      numero: nro,
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.razonSocial,
      fecha: Timestamp.fromDate(new Date(data.fecha)),
      ...(data.fechaEntregaEstimada
        ? { fechaEntregaEstimada: Timestamp.fromDate(new Date(data.fechaEntregaEstimada)) }
        : {}),
      items: data.items.map((it) => ({ ...it, cantidadRecibida: 0 })),
      total: data.total,
      estado: 'pendiente',
      directa: false,
      observaciones: data.observaciones || '',
      createdAt: Timestamp.now(),
    });

    return nro;
  });

  return {
    id: ordenRef.id,
    numero,
    proveedorId: proveedor.id,
    proveedorNombre: proveedor.razonSocial,
    fecha: new Date(data.fecha).toISOString(),
    fechaEntregaEstimada: data.fechaEntregaEstimada,
    items: data.items.map((it) => ({ ...it, cantidadRecibida: 0 })),
    total: data.total,
    estado: 'pendiente',
    directa: false,
    observaciones: data.observaciones,
    createdAt: new Date().toISOString(),
  };
}

export async function getOrdenesCompra(empresaId: string): Promise<OrdenCompra[]> {
  const q = query(col(empresaId, 'ordenes_compra'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapOrdenCompra(d.id, d.data()));
}

export async function getOrdenCompra(empresaId: string, id: string): Promise<OrdenCompra | null> {
  const snap = await getDoc(ref(empresaId, 'ordenes_compra', id));
  if (!snap.exists()) return null;
  return mapOrdenCompra(snap.id, snap.data());
}

/** Solo se puede anular una orden que todavía no recibió nada. */
export async function anularOrdenCompra(empresaId: string, ordenId: string): Promise<void> {
  const ordenRef = ref(empresaId, 'ordenes_compra', ordenId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ordenRef);
    if (!snap.exists()) throw new Error('Orden de compra no encontrada');

    const orden = mapOrdenCompra(snap.id, snap.data());
    if (orden.estado === 'anulada') throw new Error('La orden ya está anulada');
    if (orden.estado !== 'pendiente') {
      throw new Error(
        'La orden ya tiene mercadería recibida. Anulá primero las recepciones.',
      );
    }

    tx.update(ordenRef, { estado: 'anulada', anuladaAt: Timestamp.now() });
  });
}

// -------------------- Recepciones --------------------

type ItemResuelto = {
  datos: Omit<RecepcionItem, 'costoAnterior'>;
  productoRef: DocumentReference;
  stockAnterior: number;
  costoAnterior: number;
};

type ContextoRecepcion = {
  empresaId: string;
  recepcionRef: DocumentReference;
  numero: number;
  ordenId: string;
  ordenNumero: number;
  proveedorId: string;
  proveedorNombre: string;
  cuentaRef: DocumentReference;
  cuentaId: string;
  saldoAnterior: number;
  fecha: string;
  medioPago: MedioPago;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  items: ItemResuelto[];
  total: number;
};

/**
 * Las escrituras de una recepción: stock, costos, asientos y el documento.
 *
 * Separado de la lectura/validación por el mismo motivo que `escribirVenta`:
 * Firestore exige todas las lecturas antes de cualquier escritura, así que
 * esta función no lee nada.
 */
function escribirRecepcion(tx: Transaction, e: ContextoRecepcion) {
  const { empresaId, numero, cuentaId } = e;

  // Comprar aumenta lo que le debemos al proveedor. Si el pago es inmediato
  // se asienta además el contra-movimiento y el saldo neto no se mueve, igual
  // que una venta al contado.
  const saldoAfterCompra = e.saldoAnterior + e.total;
  const alContado = e.medioPago !== 'cuenta_corriente';
  const saldoFinal = alContado ? e.saldoAnterior : saldoAfterCompra;

  const movCompraRef = doc(col(empresaId, 'movimientos'));
  const movPagoRef = alContado ? doc(col(empresaId, 'movimientos')) : null;

  const itemsPersistidos: RecepcionItem[] = [];

  for (const it of e.items) {
    const { datos } = it;

    tx.update(it.productoRef, {
      stockActual: increment(datos.cantidad),
      updatedAt: Timestamp.now(),
      // Si se aceptó, el costo de la ficha pasa a ser el de esta compra.
      ...(datos.actualizoCosto ? { precioCompra: datos.costoUnitario } : {}),
    });

    registrarMovimientoStock(tx, empresaId, {
      productoId: datos.productoId,
      productoNombre: datos.productoNombre,
      tipo: 'entrada',
      cantidad: datos.cantidad,
      stockAnterior: it.stockAnterior,
      origen: 'recepcion',
      origenId: e.recepcionRef.id,
      origenNumero: numero,
    });

    if (datos.actualizoCosto && datos.costoUnitario !== it.costoAnterior) {
      tx.set(doc(col(empresaId, 'historial_costos')), {
        productoId: datos.productoId,
        productoNombre: datos.productoNombre,
        costoAnterior: it.costoAnterior,
        costoNuevo: datos.costoUnitario,
        proveedorId: e.proveedorId,
        proveedorNombre: e.proveedorNombre,
        recepcionId: e.recepcionRef.id,
        recepcionNumero: numero,
        fecha: Timestamp.fromDate(new Date(e.fecha)),
        createdAt: Timestamp.now(),
      });
    }

    itemsPersistidos.push({ ...datos, costoAnterior: it.costoAnterior });
  }

  tx.set(movCompraRef, {
    cuentaId,
    tipo: 'haber', // proveedor: haber aumenta lo que le debemos
    concepto: 'compra',
    descripcion: `Compra — recepción #${numero} (orden #${e.ordenNumero})`,
    monto: e.total,
    saldoAnterior: e.saldoAnterior,
    saldoPosterior: saldoAfterCompra,
    comprobanteTipo: e.comprobanteTipo || '',
    comprobanteNumero: e.comprobanteNumero || '',
    fecha: Timestamp.fromDate(new Date(e.fecha)),
    createdAt: Timestamp.now(),
  });

  if (movPagoRef) {
    tx.set(movPagoRef, {
      cuentaId,
      tipo: 'debe', // proveedor: debe baja lo que le debemos
      concepto: 'pago',
      descripcion: `Pago recepción #${numero} (${formatMedio(e.medioPago)})`,
      monto: e.total,
      saldoAnterior: saldoAfterCompra,
      saldoPosterior: e.saldoAnterior,
      comprobanteTipo: e.comprobanteTipo || '',
      comprobanteNumero: e.comprobanteNumero || '',
      fecha: Timestamp.fromDate(new Date(e.fecha)),
      createdAt: Timestamp.now(),
    });
  }

  tx.update(e.cuentaRef, { saldoActual: saldoFinal, updatedAt: Timestamp.now() });

  tx.set(e.recepcionRef, {
    numero,
    ordenCompraId: e.ordenId,
    ordenCompraNumero: e.ordenNumero,
    proveedorId: e.proveedorId,
    proveedorNombre: e.proveedorNombre,
    cuentaCorrienteId: cuentaId,
    fecha: Timestamp.fromDate(new Date(e.fecha)),
    items: itemsPersistidos,
    total: e.total,
    medioPago: e.medioPago,
    estado: 'completada',
    movimientoCompraId: movCompraRef.id,
    ...(movPagoRef ? { movimientoPagoId: movPagoRef.id } : {}),
    comprobanteTipo: e.comprobanteTipo || '',
    comprobanteNumero: e.comprobanteNumero || '',
    createdAt: Timestamp.now(),
  });

  return { movCompraId: movCompraRef.id, movPagoId: movPagoRef?.id };
}

function formatMedio(medio: MedioPago): string {
  const map: Record<MedioPago, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    cuenta_corriente: 'Cuenta corriente',
  };
  return map[medio];
}

/** Recalcula el estado de una orden a partir de lo recibido en cada ítem. */
function estadoSegunRecibido(items: OrdenCompraItem[]): OrdenCompra['estado'] {
  const algo = items.some((it) => it.cantidadRecibida > 0);
  const todo = items.every((it) => it.cantidadRecibida >= it.cantidad);
  if (todo) return 'recibida';
  return algo ? 'parcial' : 'pendiente';
}

export async function registrarRecepcion(
  empresaId: string,
  ordenId: string,
  data: RecepcionFormData,
): Promise<Recepcion> {
  const recibidos = data.items.filter((it) => it.cantidad > 0);
  if (recibidos.length === 0) {
    throw new Error('Indicá al menos un producto recibido');
  }

  const recepcionRef = doc(col(empresaId, 'recepciones'));
  const ordenRef = ref(empresaId, 'ordenes_compra', ordenId);
  const contadorRef = ref(empresaId, 'contadores', 'recepciones');
  const productoRefs = recibidos.map((it) => ref(empresaId, 'productos', it.productoId));

  // La cuenta se resuelve afuera: `getCuentaByEntidad` es una query y las
  // transacciones del SDK cliente solo aceptan `DocumentReference` en tx.get.
  // Dejarla adentro, además, la re-ejecutaría en cada reintento.
  const ordenPrevia = await getOrdenCompra(empresaId, ordenId);
  if (!ordenPrevia) throw new Error('Orden de compra no encontrada');

  const cuenta = await getCuentaByEntidad(empresaId, ordenPrevia.proveedorId, 'proveedor');
  if (!cuenta) throw new Error('El proveedor no tiene una cuenta corriente asociada');
  const cuentaRef = ref(empresaId, 'cuentas_corrientes', cuenta.id);

  const { numero } = await runTransaction(db, async (tx) => {
    // Todas las lecturas antes de cualquier escritura, y la orden se relee
    // acá adentro: entre la lectura previa y ahora pudo entrar otra recepción.
    const [contadorSnap, ordenSnap, cuentaSnap] = await Promise.all([
      tx.get(contadorRef),
      tx.get(ordenRef),
      tx.get(cuentaRef),
    ]);
    const productosSnap = await Promise.all(productoRefs.map((r) => tx.get(r)));

    if (!ordenSnap.exists()) throw new Error('Orden de compra no encontrada');
    if (!cuentaSnap.exists()) throw new Error('Cuenta corriente no encontrada');

    const orden = mapOrdenCompra(ordenSnap.id, ordenSnap.data());
    if (orden.estado === 'anulada') throw new Error('La orden está anulada');
    if (orden.estado === 'recibida') throw new Error('La orden ya fue recibida por completo');

    // Nadie puede recibir más de lo que se pidió.
    const items: ItemResuelto[] = recibidos.map((it, idx) => {
      const snap = productosSnap[idx];
      if (!snap.exists()) throw new Error(`Producto "${it.productoNombre}" no encontrado`);

      const enOrden = orden.items.find((o) => o.productoId === it.productoId);
      if (!enOrden) throw new Error(`"${it.productoNombre}" no figura en la orden`);

      const pendiente = enOrden.cantidad - enOrden.cantidadRecibida;
      if (it.cantidad > pendiente) {
        throw new Error(
          `No podés recibir ${it.cantidad} de "${it.productoNombre}": quedan ${pendiente} pendientes`,
        );
      }

      return {
        datos: it,
        productoRef: productoRefs[idx],
        stockAnterior: (snap.data().stockActual as number) || 0,
        costoAnterior: (snap.data().precioCompra as number) || 0,
      };
    });

    const nro = siguienteNumero(contadorSnap);
    tx.set(contadorRef, { ultimoNumero: nro, updatedAt: Timestamp.now() }, { merge: true });

    escribirRecepcion(tx, {
      empresaId,
      recepcionRef,
      numero: nro,
      ordenId,
      ordenNumero: orden.numero,
      proveedorId: orden.proveedorId,
      proveedorNombre: orden.proveedorNombre,
      cuentaRef,
      cuentaId: cuenta.id,
      saldoAnterior: (cuentaSnap.data().saldoActual as number) || 0,
      fecha: data.fecha,
      medioPago: data.medioPago,
      comprobanteTipo: data.comprobanteTipo,
      comprobanteNumero: data.comprobanteNumero,
      items,
      total: data.total,
    });

    const itemsActualizados = orden.items.map((o) => {
      const recibido = recibidos.find((r) => r.productoId === o.productoId);
      return recibido
        ? { ...o, cantidadRecibida: o.cantidadRecibida + recibido.cantidad }
        : o;
    });

    tx.update(ordenRef, {
      items: itemsActualizados,
      estado: estadoSegunRecibido(itemsActualizados),
      updatedAt: Timestamp.now(),
    });

    return { numero: nro };
  });

  const creada = await getRecepcion(empresaId, recepcionRef.id);
  if (!creada) throw new Error(`No se pudo leer la recepción #${numero}`);
  return creada;
}

export async function getRecepciones(empresaId: string): Promise<Recepcion[]> {
  const q = query(col(empresaId, 'recepciones'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapRecepcion(d.id, d.data()));
}

export async function getRecepcionesByOrden(
  empresaId: string,
  ordenId: string,
): Promise<Recepcion[]> {
  const q = query(col(empresaId, 'recepciones'), where('ordenCompraId', '==', ordenId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => mapRecepcion(d.id, d.data()))
    .sort((a, b) => a.numero - b.numero);
}

export async function getRecepcion(empresaId: string, id: string): Promise<Recepcion | null> {
  const snap = await getDoc(ref(empresaId, 'recepciones', id));
  if (!snap.exists()) return null;
  return mapRecepcion(snap.id, snap.data());
}

/**
 * Anula una recepción por contra-asiento: revierte stock, deuda y el avance
 * de la orden, sin borrar nada.
 *
 * A diferencia de `anularVenta`, esto PUEDE fallar. Anular una venta devuelve
 * stock y devolver nunca falla; anular una recepción lo descuenta, y si la
 * mercadería ya se vendió no hay de dónde sacarlo. Antes que dejar el stock
 * en negativo, preferimos frenar con un mensaje que explique por qué.
 *
 * El costo del producto NO se revierte: es un hecho histórico y deshacerlo
 * podría pisar un cambio posterior. Queda en `historial_costos`.
 */
export async function anularRecepcion(empresaId: string, recepcionId: string): Promise<void> {
  const recepcionRef = ref(empresaId, 'recepciones', recepcionId);

  const previa = await getRecepcion(empresaId, recepcionId);
  if (!previa) throw new Error('Recepción no encontrada');

  const ordenRef = ref(empresaId, 'ordenes_compra', previa.ordenCompraId);
  const cuentaRef = ref(empresaId, 'cuentas_corrientes', previa.cuentaCorrienteId);
  const productoRefs = previa.items.map((it) => ref(empresaId, 'productos', it.productoId));

  await runTransaction(db, async (tx) => {
    const [recepcionSnap, ordenSnap, cuentaSnap] = await Promise.all([
      tx.get(recepcionRef),
      tx.get(ordenRef),
      tx.get(cuentaRef),
    ]);
    const productosSnap = await Promise.all(productoRefs.map((r) => tx.get(r)));

    if (!recepcionSnap.exists()) throw new Error('Recepción no encontrada');
    if (!cuentaSnap.exists()) throw new Error('Cuenta corriente no encontrada');

    // Se relee adentro: dos clics seguidos entraban dos veces y duplicaban
    // la reversión.
    const recepcion = mapRecepcion(recepcionSnap.id, recepcionSnap.data());
    if (recepcion.estado === 'anulada') throw new Error('La recepción ya está anulada');

    // La validación que no existe en ventas.
    const stockPorItem = recepcion.items.map((it, idx) => {
      const snap = productosSnap[idx];
      if (!snap.exists()) {
        throw new Error(`El producto "${it.productoNombre}" ya no existe`);
      }
      const stock = (snap.data().stockActual as number) || 0;
      if (stock < it.cantidad) {
        throw new Error(
          `No se puede anular: de "${it.productoNombre}" quedan ${stock} ${it.unidad} y esta recepción ingresó ${it.cantidad}. Esa mercadería ya salió.`,
        );
      }
      return stock;
    });

    recepcion.items.forEach((it, idx) => {
      tx.update(productoRefs[idx], {
        stockActual: increment(-it.cantidad),
        updatedAt: Timestamp.now(),
      });
      registrarMovimientoStock(tx, empresaId, {
        productoId: it.productoId,
        productoNombre: it.productoNombre,
        tipo: 'salida',
        cantidad: it.cantidad,
        stockAnterior: stockPorItem[idx],
        origen: 'anulacion_recepcion',
        origenId: recepcionId,
        origenNumero: recepcion.numero,
      });
    });

    const saldoAnterior = (cuentaSnap.data().saldoActual as number) || 0;
    const saldoAfterAnul = saldoAnterior - recepcion.total;
    const alContado = recepcion.medioPago !== 'cuenta_corriente';
    const saldoFinal = alContado ? saldoAnterior : saldoAfterAnul;

    // Revierte el `haber` de la compra.
    const movAnulCompraRef = doc(col(empresaId, 'movimientos'));
    tx.set(movAnulCompraRef, {
      cuentaId: recepcion.cuentaCorrienteId,
      tipo: 'debe',
      concepto: 'ajuste',
      descripcion: `Anulación recepción #${recepcion.numero}`,
      monto: recepcion.total,
      saldoAnterior,
      saldoPosterior: saldoAfterAnul,
      fecha: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    let movAnulPagoId: string | undefined;
    if (alContado) {
      const movAnulPagoRef = doc(col(empresaId, 'movimientos'));
      movAnulPagoId = movAnulPagoRef.id;
      tx.set(movAnulPagoRef, {
        cuentaId: recepcion.cuentaCorrienteId,
        tipo: 'haber',
        concepto: 'ajuste',
        descripcion: `Anulación pago recepción #${recepcion.numero}`,
        monto: recepcion.total,
        saldoAnterior: saldoAfterAnul,
        saldoPosterior: saldoAnterior,
        fecha: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    }

    tx.update(cuentaRef, { saldoActual: saldoFinal, updatedAt: Timestamp.now() });

    // La orden retrocede: lo recibido vuelve atrás y el estado se recalcula.
    if (ordenSnap.exists()) {
      const orden = mapOrdenCompra(ordenSnap.id, ordenSnap.data());
      const itemsActualizados = orden.items.map((o) => {
        const devuelto = recepcion.items.find((r) => r.productoId === o.productoId);
        return devuelto
          ? { ...o, cantidadRecibida: Math.max(0, o.cantidadRecibida - devuelto.cantidad) }
          : o;
      });
      tx.update(ordenRef, {
        items: itemsActualizados,
        estado: estadoSegunRecibido(itemsActualizados),
        updatedAt: Timestamp.now(),
      });
    }

    tx.update(recepcionRef, {
      estado: 'anulada',
      anuladaAt: Timestamp.now(),
      movimientoAnulacionCompraId: movAnulCompraRef.id,
      ...(movAnulPagoId ? { movimientoAnulacionPagoId: movAnulPagoId } : {}),
    });
  });
}

/**
 * Compra directa: la mercadería ya está acá y nadie emitió una orden previa.
 * Crea la orden (marcada como directa, ya recibida) y su recepción juntas.
 */
export async function compraDirecta(
  empresaId: string,
  data: CompraDirectaFormData,
  proveedor: Proveedor,
): Promise<{ orden: OrdenCompra; recepcion: Recepcion }> {
  if (data.items.length === 0) throw new Error('La compra debe tener al menos un item');

  const ordenRef = doc(col(empresaId, 'ordenes_compra'));
  const recepcionRef = doc(col(empresaId, 'recepciones'));
  const contadorOrdenRef = ref(empresaId, 'contadores', 'ordenes_compra');
  const contadorRecepcionRef = ref(empresaId, 'contadores', 'recepciones');
  const productoRefs = data.items.map((it) => ref(empresaId, 'productos', it.productoId));

  const cuenta = await getCuentaByEntidad(empresaId, proveedor.id, 'proveedor');
  if (!cuenta) throw new Error('El proveedor no tiene una cuenta corriente asociada');
  const cuentaRef = ref(empresaId, 'cuentas_corrientes', cuenta.id);

  await runTransaction(db, async (tx) => {
    const [ordenCountSnap, recepcionCountSnap, cuentaSnap] = await Promise.all([
      tx.get(contadorOrdenRef),
      tx.get(contadorRecepcionRef),
      tx.get(cuentaRef),
    ]);
    const productosSnap = await Promise.all(productoRefs.map((r) => tx.get(r)));
    if (!cuentaSnap.exists()) throw new Error('Cuenta corriente no encontrada');

    const nroOrden = siguienteNumero(ordenCountSnap);
    const nroRecepcion = siguienteNumero(recepcionCountSnap);

    const items: ItemResuelto[] = data.items.map((it, idx) => {
      const snap = productosSnap[idx];
      if (!snap.exists()) throw new Error(`Producto "${it.productoNombre}" no encontrado`);
      return {
        datos: { ...it, actualizoCosto: data.actualizarCostoDe.includes(it.productoId) },
        productoRef: productoRefs[idx],
        stockAnterior: (snap.data().stockActual as number) || 0,
        costoAnterior: (snap.data().precioCompra as number) || 0,
      };
    });

    tx.set(contadorOrdenRef, { ultimoNumero: nroOrden, updatedAt: Timestamp.now() }, { merge: true });
    tx.set(contadorRecepcionRef, { ultimoNumero: nroRecepcion, updatedAt: Timestamp.now() }, { merge: true });

    tx.set(ordenRef, {
      numero: nroOrden,
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.razonSocial,
      fecha: Timestamp.fromDate(new Date(data.fecha)),
      items: data.items.map((it) => ({ ...it, cantidadRecibida: it.cantidad })),
      total: data.total,
      estado: 'recibida',
      directa: true,
      observaciones: data.observaciones || '',
      createdAt: Timestamp.now(),
    });

    escribirRecepcion(tx, {
      empresaId,
      recepcionRef,
      numero: nroRecepcion,
      ordenId: ordenRef.id,
      ordenNumero: nroOrden,
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.razonSocial,
      cuentaRef,
      cuentaId: cuenta.id,
      saldoAnterior: (cuentaSnap.data().saldoActual as number) || 0,
      fecha: data.fecha,
      medioPago: data.medioPago,
      comprobanteTipo: data.comprobanteTipo,
      comprobanteNumero: data.comprobanteNumero,
      items,
      total: data.total,
    });
  });

  const [orden, recepcion] = await Promise.all([
    getOrdenCompra(empresaId, ordenRef.id),
    getRecepcion(empresaId, recepcionRef.id),
  ]);
  if (!orden || !recepcion) throw new Error('No se pudo leer la compra recién creada');
  return { orden, recepcion };
}

// -------------------- Historiales --------------------

export async function getHistorialCostos(
  empresaId: string,
  productoId: string,
): Promise<CambioCosto[]> {
  const q = query(
    col(empresaId, 'historial_costos'),
    where('productoId', '==', productoId),
    orderBy('fecha', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      productoId: data.productoId,
      productoNombre: data.productoNombre,
      costoAnterior: data.costoAnterior,
      costoNuevo: data.costoNuevo,
      proveedorId: data.proveedorId,
      proveedorNombre: data.proveedorNombre,
      recepcionId: data.recepcionId,
      recepcionNumero: data.recepcionNumero,
      fecha: data.fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as CambioCosto;
  });
}

export async function getMovimientosStock(
  empresaId: string,
  productoId: string,
  limite = 50,
): Promise<MovimientoStock[]> {
  const q = query(
    col(empresaId, 'movimientos_stock'),
    where('productoId', '==', productoId),
    orderBy('fecha', 'desc'),
    fsLimit(limite),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      productoId: data.productoId,
      productoNombre: data.productoNombre,
      tipo: data.tipo,
      cantidad: data.cantidad,
      stockAnterior: data.stockAnterior,
      stockPosterior: data.stockPosterior,
      origen: data.origen,
      origenId: data.origenId,
      origenNumero: data.origenNumero,
      motivo: data.motivo,
      detalle: data.detalle,
      fecha: data.fecha?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as MovimientoStock;
  });
}

// ==================== CATÁLOGO DEL PROVEEDOR ====================
//
// Qué productos vende cada proveedor, en qué presentación y a qué precio.
// El mismo producto puede estar en varios catálogos con presentaciones y
// precios distintos — harina en bolsa de 25 kg con uno, de 10 kg con otro.

function mapItemCatalogo(id: string, data: Record<string, unknown>): ItemCatalogo {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedAt = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    id,
    proveedorId: (data.proveedorId as string) || '',
    productoId: (data.productoId as string) || '',
    productoNombre: (data.productoNombre as string) || '',
    productoCodigo: (data.productoCodigo as string) || '',
    codigoProveedor: (data.codigoProveedor as string) || '',
    presentacionId: (data.presentacionId as string) ?? null,
    presentacionNombre: (data.presentacionNombre as string) || '',
    factor: (data.factor as number) || 1,
    costoPresentacion: (data.costoPresentacion as number) || 0,
    activo: data.activo !== false,
    createdAt: createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Sin `orderBy` a propósito: una sola igualdad no necesita índice compuesto,
 * y los catálogos son chicos, así que ordenar en memoria sale más barato que
 * mantener un índice.
 */
export async function getCatalogoProveedor(
  empresaId: string,
  proveedorId: string,
): Promise<ItemCatalogo[]> {
  const q = query(col(empresaId, 'catalogo_proveedor'), where('proveedorId', '==', proveedorId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => mapItemCatalogo(d.id, d.data()))
    .sort((a, b) => a.productoNombre.localeCompare(b.productoNombre));
}

/** Los proveedores que venden un producto, para comparar precios. */
export async function getProveedoresDeProducto(
  empresaId: string,
  productoId: string,
): Promise<ItemCatalogo[]> {
  const q = query(col(empresaId, 'catalogo_proveedor'), where('productoId', '==', productoId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => mapItemCatalogo(d.id, d.data()))
    .sort((a, b) => a.costoPresentacion / a.factor - b.costoPresentacion / b.factor);
}

export async function getCatalogoCompleto(empresaId: string): Promise<ItemCatalogo[]> {
  const snapshot = await getDocs(col(empresaId, 'catalogo_proveedor'));
  return snapshot.docs.map((d) => mapItemCatalogo(d.id, d.data()));
}

function datosPresentacion(producto: Producto, presentacionId: string | null) {
  if (!presentacionId) {
    return { presentacionNombre: '', factor: 1 };
  }
  const p = producto.presentaciones.find((x: Presentacion) => x.id === presentacionId);
  if (!p) throw new Error('La presentación elegida ya no existe en el producto');
  if (p.factor <= 0) throw new Error('La presentación tiene una equivalencia inválida');
  return { presentacionNombre: p.nombre, factor: p.factor };
}

export async function addItemCatalogo(
  empresaId: string,
  proveedorId: string,
  data: ItemCatalogoFormData,
  producto: Producto,
): Promise<ItemCatalogo> {
  const { presentacionNombre, factor } = datosPresentacion(producto, data.presentacionId);

  // Un proveedor no debería tener el mismo producto y presentación dos veces:
  // al comprar quedarían dos líneas idénticas y no se sabría cuál es la buena.
  const existentes = await getCatalogoProveedor(empresaId, proveedorId);
  if (
    existentes.some(
      (x) => x.productoId === data.productoId && x.presentacionId === data.presentacionId,
    )
  ) {
    throw new Error('Este proveedor ya vende ese producto en esa presentación');
  }

  const docRef = await addDoc(col(empresaId, 'catalogo_proveedor'), {
    proveedorId,
    productoId: data.productoId,
    productoNombre: producto.nombre,
    productoCodigo: producto.codigo,
    codigoProveedor: data.codigoProveedor || '',
    presentacionId: data.presentacionId,
    presentacionNombre,
    factor,
    costoPresentacion: data.costoPresentacion,
    activo: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    proveedorId,
    productoId: data.productoId,
    productoNombre: producto.nombre,
    productoCodigo: producto.codigo,
    codigoProveedor: data.codigoProveedor,
    presentacionId: data.presentacionId,
    presentacionNombre,
    factor,
    costoPresentacion: data.costoPresentacion,
    activo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateItemCatalogo(
  empresaId: string,
  id: string,
  data: { costoPresentacion?: number; codigoProveedor?: string; activo?: boolean },
): Promise<void> {
  await updateDoc(ref(empresaId, 'catalogo_proveedor', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteItemCatalogo(empresaId: string, id: string): Promise<void> {
  await deleteDoc(ref(empresaId, 'catalogo_proveedor', id));
}

// ==================== INVENTARIO ====================

/**
 * Corrige las existencias de un producto dejando constancia de por qué.
 *
 * Es la única vía para mover stock fuera de una compra o una venta. Guarda la
 * diferencia contra lo que había, no el valor nuevo, para que el historial
 * siga reconstruyendo el stock sumando y restando desde cero.
 */
export async function ajustarStock(
  empresaId: string,
  productoId: string,
  cantidadContada: number,
  motivo: MotivoAjuste,
  detalle?: string,
): Promise<void> {
  if (cantidadContada < 0) throw new Error('La cantidad no puede ser negativa');

  const productoRef = ref(empresaId, 'productos', productoId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productoRef);
    if (!snap.exists()) throw new Error('Producto no encontrado');

    const stockAnterior = (snap.data().stockActual as number) || 0;
    const diferencia = cantidadContada - stockAnterior;
    if (diferencia === 0) return;

    tx.update(productoRef, { stockActual: cantidadContada, updatedAt: Timestamp.now() });

    registrarMovimientoStock(tx, empresaId, {
      productoId,
      productoNombre: (snap.data().nombre as string) || '',
      tipo: diferencia > 0 ? 'entrada' : 'salida',
      cantidad: Math.abs(diferencia),
      stockAnterior,
      origen: 'ajuste',
      origenId: '',
      origenNumero: 0,
      motivo,
      detalle,
    });
  });
}

/**
 * Aplica varios ajustes de una vez, uno por producto.
 *
 * Cada uno va en su propia transacción en vez de en una sola: un recuento
 * puede abarcar cientos de productos y excedería el límite de una
 * transacción, y además conviene que un producto problemático no tire abajo
 * el conteo entero. Devuelve qué se aplicó y qué falló.
 */
export async function ajustarStockMasivo(
  empresaId: string,
  ajustes: { productoId: string; cantidadContada: number }[],
  motivo: MotivoAjuste,
  detalle?: string,
): Promise<{ aplicados: number; errores: { productoId: string; error: string }[] }> {
  const errores: { productoId: string; error: string }[] = [];
  let aplicados = 0;

  for (const a of ajustes) {
    try {
      await ajustarStock(empresaId, a.productoId, a.cantidadContada, motivo, detalle);
      aplicados++;
    } catch (e) {
      errores.push({ productoId: a.productoId, error: e instanceof Error ? e.message : 'Error' });
    }
  }

  return { aplicados, errores };
}

/** El inventario valorizado a precio de costo. */
export async function getInventario(empresaId: string): Promise<LineaInventario[]> {
  const productos = await getProductos(empresaId);

  return productos
    .filter((p) => p.activo)
    .map((producto) => ({
      producto,
      valorizado: producto.stockActual * producto.precioCompra,
      bajoMinimo: producto.stockActual <= producto.stockMinimo,
    }));
}
