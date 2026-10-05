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
/**
 * Un campo que se puede dejar vacío, pero que si se completa tiene que estar
 * bien. Cargar un proveedor con el CUIT a mano, el CBU y la dirección completa
 * antes de poder anotar una compra era pedir demasiado por adelantado; un dato
 * mal cargado, en cambio, sigue siendo un error.
 */
const opcional = (validar: (v: string) => boolean, mensaje: string) =>
  z.string().refine((v) => v.trim() === '' || validar(v), mensaje);

// Del proveedor solo hace falta saber cómo se llama. Todo lo demás se completa
// cuando aparece: la factura trae el CUIT, el primer pago trae el CBU.
export const proveedorSchema = z.object({
  razonSocial: z.string().min(2, 'La razón social debe tener al menos 2 caracteres'),
  cuit: opcional((v) => cuitRegex.test(v), 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  direccion: z.object({
    calle: z.string(),
    ciudad: z.string(),
    provincia: z.string(),
    codigoPostal: z.string(),
  }),
  telefono: opcional((v) => v.replace(/\D/g, '').length >= 8, 'El teléfono debe tener al menos 8 dígitos'),
  email: opcional((v) => z.string().email().safeParse(v).success, 'Email inválido'),
  contacto: z.string(),
  condicionIva: z.enum(['responsable_inscripto', 'monotributo', 'exento']),
  datosBancarios: z.object({
    banco: z.string(),
    cbu: opcional((v) => /^\d{22}$/.test(v), 'El CBU son 22 dígitos'),
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
  unidad: z.enum(['unidad', 'kg', 'g', 'litro', 'ml', 'metro']),
  presentaciones: z
    .array(
      z.object({
        id: z.string(),
        nombre: z.string().min(1, 'Poné un nombre a la presentación'),
        // Una presentación de 0 unidades no significa nada y rompería las
        // conversiones con una división por cero.
        factor: z.number().positive('La equivalencia debe ser mayor a 0'),
      }),
    ),
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

// Schema para Venta
export const ventaItemSchema = z.object({
  productoId: z.string().min(1, 'Seleccioná un producto'),
  productoCodigo: z.string(),
  productoNombre: z.string().min(1),
  unidad: z.string(),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().min(0, 'El precio no puede ser negativo'),
  subtotal: z.number().min(0),
});

export type VentaItemSchemaType = z.infer<typeof ventaItemSchema>;

export const ventaSchema = z.object({
  clienteId: z.string().min(1, 'Seleccioná un cliente'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  items: z.array(ventaItemSchema).min(1, 'Agregá al menos un producto a la venta'),
  total: z.number().positive('El total debe ser mayor a 0'),
  medioPago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'cuenta_corriente']),
  comprobanteTipo: z.string().optional(),
  comprobanteNumero: z.string().optional(),
  observaciones: z.string().optional(),
});

export type VentaSchemaType = z.infer<typeof ventaSchema>;

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

// Schema para Usuarios
export const usuarioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  // 'super' no se puede elegir desde la app: las Firestore Rules lo rechazan
  // y el único superusuario se crea a mano.
  rol: z.enum(['dueno', 'empleado']),
});

// Schema para Empresas
export const empresaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  cuit: z.string().min(8, 'El CUIT debe tener al menos 8 caracteres'),
});

export type EmpresaSchemaType = z.infer<typeof empresaSchema>;

export type UsuarioSchemaType = z.infer<typeof usuarioSchema>;

// Schema del catálogo de un proveedor
export const itemCatalogoSchema = z.object({
  productoId: z.string().min(1, 'Elegí un producto'),
  codigoProveedor: z.string().optional(),
  presentacionId: z.string().nullable(),
  costoPresentacion: z.number().min(0, 'El costo no puede ser negativo'),
});

export type ItemCatalogoSchemaType = z.infer<typeof itemCatalogoSchema>;
