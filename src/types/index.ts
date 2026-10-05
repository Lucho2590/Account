// Tipos para Clientes
export interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string;
  direccion: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
  };
  telefono: string;
  email: string;
  contacto: string;
  limiteCredito: number;
  condicionIva: 'responsable_inscripto' | 'monotributo' | 'consumidor_final' | 'exento';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ClienteFormData = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para Proveedores
export interface Proveedor {
  id: string;
  razonSocial: string;
  cuit: string;
  direccion: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
  };
  telefono: string;
  email: string;
  contacto: string;
  condicionIva: 'responsable_inscripto' | 'monotributo' | 'exento';
  datosBancarios: {
    banco: string;
    cbu: string;
    alias: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProveedorFormData = Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para Productos
export type TipoProducto = 'venta' | 'materia_prima';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoProducto;
  /** Unidad en la que se lleva el stock. */
  unidad: UnidadBase;
  /** Formas de comprar y vender. Vacío = solo se opera en la unidad base. */
  presentaciones: Presentacion[];
  stockActual: number;
  stockMinimo: number;
  precioCompra: number;
  precioVenta: number;
  proveedorId?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductoFormData = Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para Cuentas Corrientes
export type TipoEntidad = 'cliente' | 'proveedor';

export interface CuentaCorriente {
  id: string;
  entidadId: string;
  tipoEntidad: TipoEntidad;
  saldoActual: number;
  limiteCredito?: number;
  alertaSaldo?: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos para Movimientos
export type TipoMovimiento = 'debe' | 'haber';
export type ConceptoMovimiento =
  | 'venta'
  | 'compra'
  | 'pago'
  | 'cobro'
  | 'nota_credito'
  | 'nota_debito'
  | 'ajuste';

export interface Movimiento {
  id: string;
  cuentaId: string;
  tipo: TipoMovimiento;
  concepto: ConceptoMovimiento;
  descripcion: string;
  monto: number;
  saldoAnterior: number;
  saldoPosterior: number;
  comprobanteNumero?: string;
  comprobanteTipo?: string;
  fecha: string;
  createdAt: string;
}

export type MovimientoFormData = Omit<Movimiento, 'id' | 'saldoAnterior' | 'saldoPosterior' | 'createdAt'>;

// Tipos para Ventas
export type MedioPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'cuenta_corriente';
export type EstadoVenta = 'completada' | 'anulada';

export interface VentaItem {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  /** Unidad base. `cantidad` y `precioUnitario` SIEMPRE están en esta unidad. */
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  /** Presentación usada al cargar, si no fue en unidad base. */
  presentacion?: string;
  /** Unidades base por presentación, congelado al momento de la operación. */
  factor?: number;
  /** Cuántas presentaciones; `cantidad` es esto por el factor. */
  cantidadPresentacion?: number;
  /** Precio de una presentación completa. */
  precioPresentacion?: number;
}

export interface Venta {
  id: string;
  numero: number;
  clienteId: string;
  clienteNombre: string;
  cuentaCorrienteId: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  medioPago: MedioPago;
  estado: EstadoVenta;
  movimientoVentaId: string;
  movimientoPagoId?: string;
  movimientoAnulacionVentaId?: string;
  movimientoAnulacionPagoId?: string;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  observaciones?: string;
  createdAt: string;
  anuladaAt?: string;
}

export type VentaFormData = {
  clienteId: string;
  fecha: string;
  items: VentaItem[];
  total: number;
  medioPago: MedioPago;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  observaciones?: string;
};

// Tipos para Dashboard
export interface ResumenCuentas {
  totalCobrar: number;
  totalPagar: number;
  cantidadClientesDeudores: number;
  cantidadProveedoresAcreedores: number;
}

export interface AlertaStock {
  productoId: string;
  productoNombre: string;
  stockActual: number;
  stockMinimo: number;
}

// Tipos para Empresas (tenants)
export interface Empresa {
  id: string;
  nombre: string;
  cuit: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmpresaFormData = {
  nombre: string;
  cuit: string;
};

// Tipos para Usuarios
// `super` es global y no pertenece a ninguna empresa; `dueño` gestiona la
// gente de la suya; `empleado` solo opera.
export type RolUsuario = 'super' | 'dueno' | 'empleado';

export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  activo: boolean;
  rol: RolUsuario;
  empresaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UsuarioFormData = {
  email: string;
  nombre: string;
  password: string;
  rol: Exclude<RolUsuario, 'super'>;
  empresaId: string;
};

// ==================== COMPRAS ====================

export type EstadoOrdenCompra = 'pendiente' | 'parcial' | 'recibida' | 'anulada';

export interface OrdenCompraItem {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  unidad: string;
  /** Cantidad pedida, en unidad base. */
  cantidad: number;
  /** Acumulado de todas las recepciones de esta orden, en unidad base. */
  cantidadRecibida: number;
  costoUnitario: number;
  subtotal: number;
  /** Presentación usada al cargar, si no fue en unidad base. */
  presentacion?: string;
  /** Unidades base por presentación, congelado al momento de la operación. */
  factor?: number;
  /** Cuántas presentaciones; `cantidad` es esto por el factor. */
  cantidadPresentacion?: number;
  /** Precio de una presentación completa. */
  precioPresentacion?: number;
}

export interface OrdenCompra {
  id: string;
  numero: number;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  fechaEntregaEstimada?: string;
  items: OrdenCompraItem[];
  total: number;
  estado: EstadoOrdenCompra;
  /** Nació de una compra directa: la orden y su recepción se crearon juntas. */
  directa: boolean;
  observaciones?: string;
  createdAt: string;
  anuladaAt?: string;
}

export type OrdenCompraFormData = {
  proveedorId: string;
  fecha: string;
  fechaEntregaEstimada?: string;
  items: Omit<OrdenCompraItem, 'cantidadRecibida'>[];
  total: number;
  observaciones?: string;
};

export interface RecepcionItem {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  unidad: string;
  /** Cantidad recibida en esta recepción, en unidad base. */
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  /** Presentación usada al cargar, si no fue en unidad base. */
  presentacion?: string;
  /** Unidades base por presentación, congelado al momento de la operación. */
  factor?: number;
  /** Cuántas presentaciones; `cantidad` es esto por el factor. */
  cantidadPresentacion?: number;
  /** Precio de una presentación completa. */
  precioPresentacion?: number;
  /** Lo que el producto tenía como precio de compra antes de esta recepción. */
  costoAnterior: number;
  /** Si se aceptó pisar el costo de la ficha del producto. */
  actualizoCosto: boolean;
}

export interface Recepcion {
  id: string;
  numero: number;
  ordenCompraId: string;
  ordenCompraNumero: number;
  proveedorId: string;
  proveedorNombre: string;
  cuentaCorrienteId: string;
  fecha: string;
  items: RecepcionItem[];
  total: number;
  medioPago: MedioPago;
  estado: EstadoVenta;
  movimientoCompraId: string;
  movimientoPagoId?: string;
  movimientoAnulacionCompraId?: string;
  movimientoAnulacionPagoId?: string;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  createdAt: string;
  anuladaAt?: string;
}

export type RecepcionFormData = {
  fecha: string;
  items: Omit<RecepcionItem, 'costoAnterior'>[];
  total: number;
  medioPago: MedioPago;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
};

/** Compra directa: la orden y su recepción en una sola operación. */
export type CompraDirectaFormData = OrdenCompraFormData & {
  medioPago: MedioPago;
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  /** Productos cuyo costo se acepta actualizar. */
  actualizarCostoDe: string[];
};

export interface CambioCosto {
  id: string;
  productoId: string;
  productoNombre: string;
  costoAnterior: number;
  costoNuevo: number;
  proveedorId: string;
  proveedorNombre: string;
  recepcionId: string;
  recepcionNumero: number;
  fecha: string;
  createdAt: string;
}

export type OrigenStock =
  | 'recepcion'
  | 'anulacion_recepcion'
  | 'venta'
  | 'anulacion_venta'
  | 'carga_inicial'
  | 'ajuste';

/** Por qué se ajustó el stock a mano. */
export type MotivoAjuste =
  | 'recuento'
  | 'rotura'
  | 'vencido'
  | 'robo'
  | 'devolucion'
  | 'otro';

export const MOTIVOS_AJUSTE: { value: MotivoAjuste; label: string }[] = [
  { value: 'recuento', label: 'Diferencia de recuento' },
  { value: 'rotura', label: 'Rotura' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'robo', label: 'Faltante / robo' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'otro', label: 'Otro' },
];

export interface MovimientoStock {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  origen: OrigenStock;
  /** Id de la recepción o venta que lo produjo. Vacío en los ajustes. */
  origenId: string;
  origenNumero: number;
  /** Solo en ajustes: por qué se corrigió. */
  motivo?: MotivoAjuste;
  /** Solo en ajustes: aclaración libre. */
  detalle?: string;
  fecha: string;
  createdAt: string;
}

// ==================== UNIDADES Y PRESENTACIONES ====================

/**
 * Unidad en la que se lleva el stock. Lista cerrada a propósito: con texto
 * libre convivían "kg", "Kg" y "kilo" como cosas distintas, y las
 * equivalencias entre presentaciones dejaban de tener sentido.
 */
export type UnidadBase = 'unidad' | 'kg' | 'g' | 'litro' | 'ml' | 'metro';

export const UNIDADES_BASE: { value: UnidadBase; label: string; abrev: string }[] = [
  { value: 'unidad', label: 'Unidad', abrev: 'u' },
  { value: 'kg', label: 'Kilogramo', abrev: 'kg' },
  { value: 'g', label: 'Gramo', abrev: 'g' },
  { value: 'litro', label: 'Litro', abrev: 'l' },
  { value: 'ml', label: 'Mililitro', abrev: 'ml' },
  { value: 'metro', label: 'Metro', abrev: 'm' },
];

/**
 * Una forma de comprar o vender el producto: "1 caja = 5 kg".
 *
 * El factor siempre expresa cuántas unidades base entran en una presentación,
 * así que el mismo nombre puede significar cosas distintas según el producto
 * — un balde de 20 litros de pintura y uno de 1 kg de grasa conviven sin
 * pisarse, porque la presentación cuelga del producto y no es global.
 */
export interface Presentacion {
  /** Identificador local dentro del producto. */
  id: string;
  nombre: string;
  /** Cuántas unidades base trae. 1 caja = 5 kg → factor 5. */
  factor: number;
}

/**
 * Qué productos vende cada proveedor, en qué presentación y a qué precio.
 * Un mismo producto puede estar en el catálogo de varios proveedores con
 * presentaciones y precios distintos.
 */
export interface ItemCatalogo {
  id: string;
  proveedorId: string;
  productoId: string;
  /** Desnormalizado para listar sin resolver el producto. */
  productoNombre: string;
  productoCodigo: string;
  /** Cómo llama el proveedor a este producto, si difiere. */
  codigoProveedor?: string;
  /** `null` = lo vende suelto, en la unidad base del producto. */
  presentacionId: string | null;
  presentacionNombre: string;
  /** Unidades base por presentación. 1 si se vende suelto. */
  factor: number;
  /** Lo que cuesta una presentación completa. */
  costoPresentacion: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemCatalogoFormData = {
  productoId: string;
  codigoProveedor?: string;
  presentacionId: string | null;
  costoPresentacion: number;
};

/** Una línea del inventario: el producto con su valorización a costo. */
export interface LineaInventario {
  producto: Producto;
  /** stockActual por precioCompra. */
  valorizado: number;
  bajoMinimo: boolean;
}
