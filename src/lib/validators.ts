import { z } from 'zod';

// Validación de CUIT argentino
const cuitRegex = /^\d{2}-?\d{8}-?\d{1}$/;

// Schema para Cliente
export const clienteSchema = z.object({
  razonSocial: z.string().min(2, 'La razón social debe tener al menos 2 caracteres'),
  cuit: z.string().regex(cuitRegex, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es requerida'),
    ciudad: z.string().min(1, 'La ciudad es requerida'),
    provincia: z.string().min(1, 'La provincia es requerida'),
    codigoPostal: z.string().min(1, 'El código postal es requerido'),
  }),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  email: z.string().email('Email inválido'),
  contacto: z.string(),
  limiteCredito: z.number().min(0, 'El límite de crédito no puede ser negativo'),
  condicionIva: z.enum(['responsable_inscripto', 'monotributo', 'consumidor_final', 'exento']),
  activo: z.boolean(),
});

export type ClienteSchemaType = z.infer<typeof clienteSchema>;

// Schema para Proveedor
export const proveedorSchema = z.object({
  razonSocial: z.string().min(2, 'La razón social debe tener al menos 2 caracteres'),
  cuit: z.string().regex(cuitRegex, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es requerida'),
    ciudad: z.string().min(1, 'La ciudad es requerida'),
    provincia: z.string().min(1, 'La provincia es requerida'),
    codigoPostal: z.string().min(1, 'El código postal es requerido'),
  }),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  email: z.string().email('Email inválido'),
  contacto: z.string(),
  condicionIva: z.enum(['responsable_inscripto', 'monotributo', 'exento']),
  datosBancarios: z.object({
    banco: z.string().min(1, 'El banco es requerido'),
    cbu: z.string().length(22, 'El CBU debe tener 22 dígitos'),
    alias: z.string(),
  }),
  activo: z.boolean(),
});

export type ProveedorSchemaType = z.infer<typeof proveedorSchema>;

// Schema para Producto
export const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string(),
  tipo: z.enum(['venta', 'materia_prima']),
  unidad: z.string().min(1, 'La unidad es requerida'),
  stockActual: z.number().min(0, 'El stock no puede ser negativo'),
  stockMinimo: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  precioCompra: z.number().min(0, 'El precio de compra no puede ser negativo'),
  precioVenta: z.number().min(0, 'El precio de venta no puede ser negativo'),
  proveedorId: z.string().optional(),
  activo: z.boolean(),
});

export type ProductoSchemaType = z.infer<typeof productoSchema>;

// Schema para Movimiento
export const movimientoSchema = z.object({
  cuentaId: z.string().min(1, 'La cuenta es requerida'),
  tipo: z.enum(['debe', 'haber']),
  concepto: z.enum(['venta', 'compra', 'pago', 'cobro', 'nota_credito', 'nota_debito', 'ajuste']),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  comprobanteNumero: z.string().optional(),
  comprobanteTipo: z.string().optional(),
  fecha: z.string().min(1, 'La fecha es requerida'),
});

export type MovimientoSchemaType = z.infer<typeof movimientoSchema>;

// Schema para Contacto
export const contactoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  empresa: z.string(),
  cargo: z.string(),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  email: z.string().email('Email inválido').or(z.literal('')),
  notas: z.string(),
  entidadId: z.string().optional(),
  tipoEntidad: z.enum(['cliente', 'proveedor']).optional(),
});

export type ContactoSchemaType = z.infer<typeof contactoSchema>;

// Schema para Login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
