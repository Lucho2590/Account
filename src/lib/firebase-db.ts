import { db } from './firebase';
import {
  collection,
  addDoc,
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
  Contacto,
  ContactoFormData,
  TipoEntidad,
} from '@/types';

// ==================== CLIENTES ====================

export async function addCliente(data: ClienteFormData): Promise<Cliente> {
  const docRef = await addDoc(collection(db, 'clientes'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Crear cuenta corriente asociada
  await addDoc(collection(db, 'cuentas_corrientes'), {
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

export async function getClientes(): Promise<Cliente[]> {
  const q = query(collection(db, 'clientes'), orderBy('razonSocial'));
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

export async function getCliente(id: string): Promise<Cliente | null> {
  const docRef = doc(db, 'clientes', id);
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

export async function updateCliente(id: string, data: Partial<ClienteFormData>): Promise<void> {
  const docRef = doc(db, 'clientes', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCliente(id: string): Promise<void> {
  // Eliminar cliente
  await deleteDoc(doc(db, 'clientes', id));

  // Eliminar cuenta corriente asociada
  const cuentaQuery = query(
    collection(db, 'cuentas_corrientes'),
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

export async function addProveedor(data: ProveedorFormData): Promise<Proveedor> {
  const docRef = await addDoc(collection(db, 'proveedores'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Crear cuenta corriente asociada
  await addDoc(collection(db, 'cuentas_corrientes'), {
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

export async function getProveedores(): Promise<Proveedor[]> {
  const q = query(collection(db, 'proveedores'), orderBy('razonSocial'));
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

export async function getProveedor(id: string): Promise<Proveedor | null> {
  const docRef = doc(db, 'proveedores', id);
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

export async function updateProveedor(id: string, data: Partial<ProveedorFormData>): Promise<void> {
  const docRef = doc(db, 'proveedores', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProveedor(id: string): Promise<void> {
  await deleteDoc(doc(db, 'proveedores', id));

  const cuentaQuery = query(
    collection(db, 'cuentas_corrientes'),
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

export async function addProducto(data: ProductoFormData): Promise<Producto> {
  const docRef = await addDoc(collection(db, 'productos'), {
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

export async function getProductos(): Promise<Producto[]> {
  const q = query(collection(db, 'productos'), orderBy('nombre'));
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

export async function getProducto(id: string): Promise<Producto | null> {
  const docRef = doc(db, 'productos', id);
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

export async function updateProducto(id: string, data: Partial<ProductoFormData>): Promise<void> {
  const docRef = doc(db, 'productos', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProducto(id: string): Promise<void> {
  await deleteDoc(doc(db, 'productos', id));
}

// ==================== CUENTAS CORRIENTES ====================

export async function getCuentasCorrientes(): Promise<CuentaCorriente[]> {
  const q = query(collection(db, 'cuentas_corrientes'));
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
  entidadId: string,
  tipoEntidad: TipoEntidad
): Promise<CuentaCorriente | null> {
  const q = query(
    collection(db, 'cuentas_corrientes'),
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

export async function addMovimiento(data: MovimientoFormData): Promise<Movimiento> {
  // Obtener cuenta corriente
  const cuentaRef = doc(db, 'cuentas_corrientes', data.cuentaId);
  const cuentaSnap = await getDoc(cuentaRef);

  if (!cuentaSnap.exists()) {
    throw new Error('Cuenta corriente no encontrada');
  }

  const cuentaData = cuentaSnap.data();
  const saldoAnterior = cuentaData.saldoActual || 0;

  // Calcular nuevo saldo
  // Para clientes: debe = aumenta saldo (nos deben), haber = disminuye (nos pagan)
  // Para proveedores: debe = disminuye saldo (les debemos menos), haber = aumenta (les debemos más)
  const tipoEntidad = cuentaData.tipoEntidad as TipoEntidad;
  let saldoPosterior: number;

  if (tipoEntidad === 'cliente') {
    saldoPosterior = data.tipo === 'debe'
      ? saldoAnterior + data.monto
      : saldoAnterior - data.monto;
  } else {
    saldoPosterior = data.tipo === 'haber'
      ? saldoAnterior + data.monto
      : saldoAnterior - data.monto;
  }

  // Crear movimiento
  const movimientoRef = await addDoc(collection(db, 'movimientos'), {
    ...data,
    saldoAnterior,
    saldoPosterior,
    fecha: Timestamp.fromDate(new Date(data.fecha)),
    createdAt: Timestamp.now(),
  });

  // Actualizar saldo de la cuenta
  await updateDoc(cuentaRef, {
    saldoActual: saldoPosterior,
    updatedAt: Timestamp.now(),
  });

  return {
    id: movimientoRef.id,
    ...data,
    saldoAnterior,
    saldoPosterior,
    createdAt: new Date().toISOString(),
  };
}

export async function getMovimientosByCuenta(cuentaId: string): Promise<Movimiento[]> {
  const q = query(
    collection(db, 'movimientos'),
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

export async function getUltimosMovimientos(limit: number = 10): Promise<Movimiento[]> {
  const q = query(
    collection(db, 'movimientos'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.slice(0, limit).map((doc) => {
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

// ==================== CONTACTOS ====================

export async function addContacto(data: ContactoFormData): Promise<Contacto> {
  const docRef = await addDoc(collection(db, 'contactos'), {
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

export async function getContactos(): Promise<Contacto[]> {
  const q = query(collection(db, 'contactos'), orderBy('nombre'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: data.nombre,
      empresa: data.empresa || '',
      cargo: data.cargo || '',
      telefono: data.telefono,
      email: data.email || '',
      notas: data.notas || '',
      entidadId: data.entidadId,
      tipoEntidad: data.tipoEntidad,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Contacto;
  });
}

export async function updateContacto(id: string, data: Partial<ContactoFormData>): Promise<void> {
  const docRef = doc(db, 'contactos', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteContacto(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contactos', id));
}

// ==================== RESUMEN DASHBOARD ====================

export async function getResumenCuentas() {
  const cuentas = await getCuentasCorrientes();

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

export async function getAlertasStock() {
  const productos = await getProductos();

  return productos
    .filter((p) => p.activo && p.stockActual <= p.stockMinimo)
    .map((p) => ({
      productoId: p.id,
      productoNombre: p.nombre,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
    }));
}
