import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear moneda en Pesos Argentinos
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Formatear número con separadores de miles
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-AR').format(num);
}

// Formatear fecha corta (dd/MM/yyyy)
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: es });
}

// Formatear fecha larga (dd de MMMM de yyyy)
export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: es });
}

// Formatear fecha y hora
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
}

// Formatear CUIT con guiones
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/\D/g, '');
  if (cleaned.length !== 11) return cuit;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

// Formatear CBU
export function formatCBU(cbu: string): string {
  const cleaned = cbu.replace(/\D/g, '');
  if (cleaned.length !== 22) return cbu;
  return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 22)}`;
}

// Formatear teléfono
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Formatear condición de IVA
export function formatCondicionIva(condicion: string): string {
  const condiciones: Record<string, string> = {
    responsable_inscripto: 'Responsable Inscripto',
    monotributo: 'Monotributo',
    consumidor_final: 'Consumidor Final',
    exento: 'Exento',
  };
  return condiciones[condicion] || condicion;
}

// Formatear tipo de movimiento
export function formatTipoMovimiento(tipo: string): string {
  return tipo === 'debe' ? 'Debe' : 'Haber';
}

// Formatear concepto de movimiento
export function formatConcepto(concepto: string): string {
  const conceptos: Record<string, string> = {
    venta: 'Venta',
    compra: 'Compra',
    pago: 'Pago',
    cobro: 'Cobro',
    nota_credito: 'Nota de Crédito',
    nota_debito: 'Nota de Débito',
    ajuste: 'Ajuste',
  };
  return conceptos[concepto] || concepto;
}

// Truncar texto largo
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
