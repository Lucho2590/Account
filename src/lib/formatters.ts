import type { TipoEntidad, TipoMovimiento } from '@/types';

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

// Estado semántico del saldo, según tipo de entidad
export type SaldoEstado = 'al_dia' | 'a_cobrar' | 'a_pagar' | 'a_favor_cliente' | 'a_favor_proveedor';

export function getSaldoEstado(
  saldo: number,
  tipoEntidad: 'cliente' | 'proveedor',
): SaldoEstado {
  if (saldo === 0) return 'al_dia';
  if (tipoEntidad === 'cliente') {
    return saldo > 0 ? 'a_cobrar' : 'a_favor_cliente';
  }
  return saldo > 0 ? 'a_pagar' : 'a_favor_proveedor';
}

export function formatSaldoEstado(estado: SaldoEstado): string {
  const map: Record<SaldoEstado, string> = {
    al_dia: 'Al día',
    a_cobrar: 'Nos debe',
    a_pagar: 'Le debemos',
    a_favor_cliente: 'Saldo a favor',
    a_favor_proveedor: 'Anticipo a favor',
  };
  return map[estado];
}

// Formatear medio de pago
export function formatMedioPago(medio: string): string {
  const map: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    cuenta_corriente: 'Cuenta corriente',
  };
  return map[medio] || medio;
}

// Formatear estado de un comprobante (venta, compra, recepción)
export function formatEstadoComprobante(estado: string): string {
  return estado === 'anulada' ? 'Anulada' : 'Completada';
}

/** @deprecated Usar formatEstadoComprobante: el estado no es propio de ventas. */
export const formatEstadoVenta = formatEstadoComprobante;

// Efecto de un movimiento sobre el saldo, según de quién sea la cuenta.
//
// Es la misma regla de signo que aplica `addMovimiento` al calcular el saldo,
// y la única pieza de la que dependen todas las etiquetas y colores de la UI:
//   cliente   → `debe` aumenta lo que nos deben
//   proveedor → `haber` aumenta lo que le debemos
export type EfectoSaldo = 'aumenta' | 'disminuye';

export function getEfectoMovimiento(
  tipoEntidad: TipoEntidad,
  tipo: TipoMovimiento,
): EfectoSaldo {
  if (tipoEntidad === 'cliente') {
    return tipo === 'debe' ? 'aumenta' : 'disminuye';
  }
  return tipo === 'haber' ? 'aumenta' : 'disminuye';
}

/** Cómo se llama cada lado del libro mayor según la entidad. */
export function etiquetasMovimiento(tipoEntidad: TipoEntidad) {
  return tipoEntidad === 'cliente'
    ? { aumenta: 'Le facturamos', disminuye: 'Cobramos' }
    : { aumenta: 'Nos facturaron', disminuye: 'Pagamos' };
}

/** El saldo que queda tras aplicar un movimiento. */
export function aplicarMovimiento(
  saldoAnterior: number,
  tipoEntidad: TipoEntidad,
  tipo: TipoMovimiento,
  monto: number,
): number {
  return getEfectoMovimiento(tipoEntidad, tipo) === 'aumenta'
    ? saldoAnterior + monto
    : saldoAnterior - monto;
}

// Formatear estado de una orden de compra
export function formatEstadoOrden(estado: string): string {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    parcial: 'Recibida en parte',
    recibida: 'Recibida',
    anulada: 'Anulada',
  };
  return map[estado] || estado;
}

// De dónde vino un movimiento de stock
export function formatOrigenStock(origen: string): string {
  const map: Record<string, string> = {
    recepcion: 'Recepción',
    anulacion_recepcion: 'Anulación de recepción',
    venta: 'Venta',
    anulacion_venta: 'Anulación de venta',
    carga_inicial: 'Carga inicial',
    ajuste: 'Ajuste',
  };
  return map[origen] || origen;
}

export function formatMotivoAjuste(motivo?: string): string {
  if (!motivo) return '';
  const map: Record<string, string> = {
    recuento: 'Diferencia de recuento',
    rotura: 'Rotura',
    vencido: 'Vencido',
    robo: 'Faltante / robo',
    devolucion: 'Devolución',
    otro: 'Otro',
  };
  return map[motivo] || motivo;
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
