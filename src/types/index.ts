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
  unidad: string;
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

// Tipos para Contactos (Agenda)
export interface Contacto {
  id: string;
  nombre: string;
  empresa: string;
  cargo: string;
  telefono: string;
  email: string;
  notas: string;
  entidadId?: string;
  tipoEntidad?: TipoEntidad;
  createdAt: string;
  updatedAt: string;
}

export type ContactoFormData = Omit<Contacto, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para Ventas
export type MedioPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'cuenta_corriente';
export type EstadoVenta = 'completada' | 'anulada';

export interface VentaItem {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
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
