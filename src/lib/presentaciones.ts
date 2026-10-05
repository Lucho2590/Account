import type { Producto, Presentacion, VentaItem, UnidadBase } from '@/types';
import { UNIDADES_BASE } from '@/types';

/**
 * Conversión entre presentaciones y unidad base.
 *
 * El invariante de todo el sistema es que `cantidad` y `precioUnitario` de un
 * item SIEMPRE están en la unidad base del producto: es lo que mueve el stock,
 * lo que validan los controles y lo que acumulan las órdenes. La presentación
 * viaja al lado como metadata de captura, para poder mostrar "3 cajas" en vez
 * de "15 kg" y para dejar registrado a qué precio se pactó la caja.
 */

export const abrevUnidad = (u: string): string =>
  UNIDADES_BASE.find((x) => x.value === u)?.abrev ?? u;

export function formatCantidad(cantidad: number, unidad: string): string {
  // Sin decimales cuando no hacen falta: "3 kg" se lee mejor que "3,00 kg".
  const n = Number.isInteger(cantidad) ? cantidad : Number(cantidad.toFixed(3));
  return `${n} ${abrevUnidad(unidad)}`;
}

/** Descripción corta de una equivalencia: "1 caja = 5 kg". */
export function describirPresentacion(p: Presentacion, unidad: UnidadBase): string {
  return `1 ${p.nombre.toLowerCase()} = ${p.factor} ${abrevUnidad(unidad)}`;
}

type ArmarItemArgs = {
  producto: Producto;
  /** `null` = se opera suelto, en unidad base. */
  presentacion: Presentacion | null;
  cantidadPresentacion: number;
  /** Precio de una presentación completa (o de una unidad base si no hay). */
  precioPresentacion: number;
};

/**
 * Construye un item ya convertido a unidad base, conservando la presentación
 * usada. Es el único lugar donde se hace la división por el factor.
 */
export function armarItem({
  producto,
  presentacion,
  cantidadPresentacion,
  precioPresentacion,
}: ArmarItemArgs): VentaItem {
  const factor = presentacion ? presentacion.factor : 1;
  const cantidad = cantidadPresentacion * factor;
  const precioUnitario = factor > 0 ? precioPresentacion / factor : 0;

  return {
    productoId: producto.id,
    productoCodigo: producto.codigo,
    productoNombre: producto.nombre,
    unidad: producto.unidad,
    cantidad,
    precioUnitario,
    subtotal: cantidad * precioUnitario,
    ...(presentacion
      ? {
          presentacion: presentacion.nombre,
          factor,
          cantidadPresentacion,
          precioPresentacion,
        }
      : {}),
  };
}

/** Reaplica la conversión cuando cambia la cantidad o el precio en pantalla. */
export function recalcularItem(
  item: VentaItem,
  patch: { cantidadPresentacion?: number; precioPresentacion?: number },
): Partial<VentaItem> {
  const factor = item.factor ?? 1;
  const cantidadPresentacion =
    patch.cantidadPresentacion ?? item.cantidadPresentacion ?? item.cantidad;
  const precioPresentacion =
    patch.precioPresentacion ?? item.precioPresentacion ?? item.precioUnitario;

  const cantidad = cantidadPresentacion * factor;
  const precioUnitario = factor > 0 ? precioPresentacion / factor : 0;

  return {
    cantidadPresentacion,
    precioPresentacion,
    cantidad,
    precioUnitario,
    subtotal: cantidad * precioUnitario,
  };
}

/** Lo que se muestra debajo del nombre cuando hay presentación. */
export function equivalenciaDeItem(item: VentaItem): string | null {
  if (!item.presentacion || !item.factor) return null;
  return `${formatCantidad(item.cantidad, item.unidad)} · ${item.presentacion.toLowerCase()} de ${item.factor} ${abrevUnidad(item.unidad)}`;
}
