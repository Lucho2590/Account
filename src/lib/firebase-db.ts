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
  increment,
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
  Venta,
  VentaFormData,
  VentaItem,
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

export async function createVenta(
  data: VentaFormData,
  cliente: Cliente,
): Promise<Venta> {
  if (data.items.length === 0) {
    throw new Error('La venta debe tener al menos un item');
  }

  const cuenta = await getCuentaByEntidad(cliente.id, 'cliente');
  if (!cuenta) {
    throw new Error('El cliente no tiene una cuenta corriente asociada');
  }

  const productosSnap = await Promise.all(
    data.items.map((it) => getDoc(doc(db, 'productos', it.productoId))),
  );
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

  const saldoAnterior = cuenta.saldoActual;
  const saldoAfterVenta = saldoAnterior + data.total;
  const saldoFinal =
    data.medioPago === 'cuenta_corriente' ? saldoAfterVenta : saldoAnterior;

  const ventasCountSnap = await getDocs(collection(db, 'ventas'));
  const numero = ventasCountSnap.size + 1;

  const batch = writeBatch(db);

  const ventaRef = doc(collection(db, 'ventas'));
  const movVentaRef = doc(collection(db, 'movimientos'));
  const movPagoRef =
    data.medioPago !== 'cuenta_corriente' ? doc(collection(db, 'movimientos')) : null;

  data.items.forEach((it) => {
    batch.update(doc(db, 'productos', it.productoId), {
      stockActual: increment(-it.cantidad),
      updatedAt: Timestamp.now(),
    });
  });

  const descripcionVenta = `Venta #${numero} — ${data.items.length} item${data.items.length === 1 ? '' : 's'}`;
  batch.set(movVentaRef, {
    cuentaId: cuenta.id,
    tipo: 'debe',
    concepto: 'venta',
    descripcion: descripcionVenta,
    monto: data.total,
    saldoAnterior,
    saldoPosterior: saldoAfterVenta,
    comprobanteTipo: data.comprobanteTipo || '',
    comprobanteNumero: data.comprobanteNumero || '',
    fecha: Timestamp.fromDate(new Date(data.fecha)),
    createdAt: Timestamp.now(),
  });

  if (movPagoRef) {
    const medioLabel =
      data.medioPago === 'efectivo'
        ? 'Efectivo'
        : data.medioPago === 'transferencia'
          ? 'Transferencia'
          : data.medioPago === 'tarjeta'
            ? 'Tarjeta'
            : 'Cheque';
    batch.set(movPagoRef, {
      cuentaId: cuenta.id,
      tipo: 'haber',
      concepto: 'cobro',
      descripcion: `Cobro venta #${numero} (${medioLabel})`,
      monto: data.total,
      saldoAnterior: saldoAfterVenta,
      saldoPosterior: saldoAnterior,
      comprobanteTipo: data.comprobanteTipo || '',
      comprobanteNumero: data.comprobanteNumero || '',
      fecha: Timestamp.fromDate(new Date(data.fecha)),
      createdAt: Timestamp.now(),
    });
  }

  batch.update(doc(db, 'cuentas_corrientes', cuenta.id), {
    saldoActual: saldoFinal,
    updatedAt: Timestamp.now(),
  });

  batch.set(ventaRef, {
    numero,
    clienteId: cliente.id,
    clienteNombre: cliente.razonSocial,
    cuentaCorrienteId: cuenta.id,
    fecha: Timestamp.fromDate(new Date(data.fecha)),
    items: data.items,
    total: data.total,
    medioPago: data.medioPago,
    estado: 'completada',
    movimientoVentaId: movVentaRef.id,
    ...(movPagoRef ? { movimientoPagoId: movPagoRef.id } : {}),
    comprobanteTipo: data.comprobanteTipo || '',
    comprobanteNumero: data.comprobanteNumero || '',
    observaciones: data.observaciones || '',
    createdAt: Timestamp.now(),
  });

  await batch.commit();

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

export async function getVentas(): Promise<Venta[]> {
  const q = query(collection(db, 'ventas'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapVentaDoc(d.id, d.data()));
}

export async function getVenta(id: string): Promise<Venta | null> {
  const snap = await getDoc(doc(db, 'ventas', id));
  if (!snap.exists()) return null;
  return mapVentaDoc(snap.id, snap.data());
}

export async function anularVenta(ventaId: string): Promise<void> {
  const ventaSnap = await getDoc(doc(db, 'ventas', ventaId));
  if (!ventaSnap.exists()) throw new Error('Venta no encontrada');

  const venta = mapVentaDoc(ventaSnap.id, ventaSnap.data());
  if (venta.estado === 'anulada') throw new Error('La venta ya está anulada');

  const cuentaSnap = await getDoc(doc(db, 'cuentas_corrientes', venta.cuentaCorrienteId));
  if (!cuentaSnap.exists()) throw new Error('Cuenta corriente no encontrada');
  const saldoAnterior = (cuentaSnap.data().saldoActual as number) || 0;

  // Reversión: siempre creamos un movimiento "haber" de ajuste que descuenta la deuda
  // del venta original. Si hubo cobro, también creamos otro movimiento "debe" que
  // deshace el cobro. Neto sobre cuenta corriente:
  //  - cuenta_corriente: saldo baja en total (se revierte la deuda)
  //  - otros medios: saldo queda igual (ambos ajustes se netean)
  const saldoAfterAnulVenta = saldoAnterior - venta.total;
  const saldoFinal =
    venta.medioPago === 'cuenta_corriente' ? saldoAfterAnulVenta : saldoAnterior;

  const batch = writeBatch(db);

  venta.items.forEach((it) => {
    batch.update(doc(db, 'productos', it.productoId), {
      stockActual: increment(it.cantidad),
      updatedAt: Timestamp.now(),
    });
  });

  const movAnulVentaRef = doc(collection(db, 'movimientos'));
  batch.set(movAnulVentaRef, {
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
    const movAnulPagoRef = doc(collection(db, 'movimientos'));
    movAnulPagoId = movAnulPagoRef.id;
    batch.set(movAnulPagoRef, {
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

  batch.update(doc(db, 'cuentas_corrientes', venta.cuentaCorrienteId), {
    saldoActual: saldoFinal,
    updatedAt: Timestamp.now(),
  });

  batch.update(doc(db, 'ventas', ventaId), {
    estado: 'anulada',
    anuladaAt: Timestamp.now(),
    movimientoAnulacionVentaId: movAnulVentaRef.id,
    ...(movAnulPagoId ? { movimientoAnulacionPagoId: movAnulPagoId } : {}),
  });

  await batch.commit();
}
