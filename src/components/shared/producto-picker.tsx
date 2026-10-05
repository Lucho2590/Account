'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Package, Search } from 'lucide-react';
import { Producto, Presentacion, ItemCatalogo } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { abrevUnidad, describirPresentacion, formatCantidad } from '@/lib/presentaciones';
import { cn } from '@/lib/utils';

/**
 * Identidad de un renglón. Se usa el nombre de la presentación y no su id
 * porque es lo que `VentaItem` guarda, y es con eso que el formulario decide
 * si suma cantidad a una línea existente o abre una nueva.
 */
export function claveItem(productoId: string, presentacion: string | null) {
  return `${productoId}::${presentacion ?? ''}`;
}

/** Una forma concreta de comprar o vender: el producto en una presentación. */
interface Opcion {
  /** Único en la lista: mismo producto en dos presentaciones son dos opciones. */
  key: string;
  producto: Producto;
  presentacion: Presentacion | null;
  /** Lo que sale una presentación completa. */
  precio: number;
  /** Viene de la lista de precios del proveedor, no de la ficha. */
  delCatalogo: boolean;
  sinStock: boolean;
}

interface ProductoPickerProps {
  productos: Producto[];
  /**
   * `presentacion` es null cuando se elige el producto suelto, en su unidad
   * base. `precioPresentacion` llega solo cuando el precio sale del catálogo
   * del proveedor, que manda sobre el de la ficha.
   */
  onSelect: (
    producto: Producto,
    presentacion: Presentacion | null,
    precioPresentacion?: number,
  ) => void;
  /**
   * Líneas ya cargadas, como `productoId::presentación`. Se excluye la
   * combinación exacta y no el producto entero: comprar el mismo artículo en
   * bolsa y suelto son dos renglones legítimos, con precio propio cada uno.
   */
  excludeKeys?: string[];
  /** Qué precio mostrar: el de venta (default) o el de compra. */
  precioField?: 'precioVenta' | 'precioCompra';
  /**
   * Si impedir elegir productos sin stock. Tiene sentido al vender; al
   * comprar es justo lo contrario — reponer lo agotado es el caso normal.
   */
  bloquearSinStock?: boolean;
  /**
   * Lo que vende un proveedor, ya filtrado. Encabeza la lista: es el camino
   * rápido, porque trae el precio pactado. Antes esto era una fila de chips
   * aparte y había dos maneras de hacer lo mismo.
   */
  catalogo?: ItemCatalogo[];
  catalogoLabel?: string;
  placeholder?: string;
}

export function ProductoPicker({
  productos,
  onSelect,
  excludeKeys = [],
  precioField = 'precioVenta',
  bloquearSinStock = true,
  catalogo = [],
  catalogoLabel = 'Del proveedor',
  placeholder = 'Buscar producto por nombre o código…',
}: ProductoPickerProps) {
  const [search, setSearch] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [marcado, setMarcado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  // La Card que envuelve el formulario tiene overflow-hidden y recortaba la
  // lista. Se dibuja en un portal, anclada a la posición del input.
  const [caja, setCaja] = useState<{ left: number; top: number; width: number } | null>(null);

  function medir() {
    const r = contenedor.current?.getBoundingClientRect();
    if (r) setCaja({ left: r.left, top: r.bottom + 4, width: r.width });
  }

  function abrir() {
    medir();
    setAbierto(true);
  }

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  // Todas las opciones posibles, con las del catálogo primero. Un producto que
  // está en el catálogo no se repite abajo en la misma presentación.
  const opciones = useMemo(() => {
    const out: Opcion[] = [];
    const vistas = new Set<string>();

    const agregar = (o: Opcion) => {
      if (vistas.has(o.key)) return;
      vistas.add(o.key);
      out.push(o);
    };

    for (const c of catalogo) {
      const producto = porId.get(c.productoId);
      if (!producto || !producto.activo) continue;
      const presentacion = c.presentacionId
        ? producto.presentaciones.find((x) => x.id === c.presentacionId) ?? null
        : null;
      agregar({
        key: claveItem(producto.id, presentacion?.nombre ?? null),
        producto,
        presentacion,
        precio: c.costoPresentacion,
        delCatalogo: true,
        sinStock: bloquearSinStock && producto.stockActual <= 0,
      });
    }

    for (const p of productos) {
      if (!p.activo) continue;
      const formas: (Presentacion | null)[] = [
        null,
        ...p.presentaciones.filter((pr) => pr.nombre && pr.factor > 0),
      ];
      for (const pres of formas) {
        agregar({
          key: claveItem(p.id, pres?.nombre ?? null),
          producto: p,
          presentacion: pres,
          precio: p[precioField] * (pres?.factor ?? 1),
          delCatalogo: false,
          sinStock: bloquearSinStock && p.stockActual <= 0,
        });
      }
    }

    return out.filter((o) => !excludeKeys.includes(o.key));
  }, [catalogo, productos, porId, precioField, bloquearSinStock, excludeKeys]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opciones.slice(0, 50);
    return opciones
      .filter((o) => {
        const p = o.producto;
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          (o.presentacion?.nombre.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 50);
  }, [opciones, search]);

  // Si la lista se achica, el marcado se clampea al vuelo en vez de
  // sincronizarse con un efecto: así nunca apunta a una fila que no existe.
  const indice = filtradas.length === 0 ? 0 : Math.min(marcado, filtradas.length - 1);

  // Reposiciona mientras está abierta: la página puede scrollear debajo.
  useEffect(() => {
    if (!abierto) return;
    const r = () => {
      const b = contenedor.current?.getBoundingClientRect();
      if (b) setCaja({ left: b.left, top: b.bottom + 4, width: b.width });
    };
    window.addEventListener('scroll', r, true);
    window.addEventListener('resize', r);
    return () => {
      window.removeEventListener('scroll', r, true);
      window.removeEventListener('resize', r);
    };
  }, [abierto]);

  // Cierra al clickear afuera. Con la lista en un portal no alcanza el onBlur
  // del contenedor: el DOM del popup cuelga de <body>, no de acá.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (contenedor.current?.contains(t) || popup.current?.contains(t)) return;
      setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  // Mantiene visible la fila marcada al moverse con el teclado.
  useEffect(() => {
    if (!abierto) return;
    listaRef.current
      ?.querySelector(`[data-indice="${indice}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [indice, abierto]);

  function elegir(o: Opcion) {
    if (o.sinStock) return;
    onSelect(o.producto, o.presentacion, o.delCatalogo ? o.precio : undefined);
    setSearch('');
    setAbierto(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!abierto) return abrir();
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      const n = filtradas.length;
      if (n > 0) setMarcado((indice + paso + n) % n);
    } else if (e.key === 'Enter') {
      if (!abierto || !filtradas[indice]) return;
      e.preventDefault();
      elegir(filtradas[indice]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  const hayCatalogo = filtradas.some((o) => o.delCatalogo);

  return (
    <div ref={contenedor} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          role="combobox"
          aria-expanded={abierto}
          aria-controls="lista-productos"
          autoComplete="off"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setMarcado(0);
            abrir();
          }}
          onFocus={abrir}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={abierto ? 'Cerrar lista' : 'Ver todos los productos'}
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', abierto && 'rotate-180')}
          />
        </button>
      </div>

      {abierto && caja && createPortal(
        <div
          ref={popup}
          style={{ position: 'fixed', left: caja.left, top: caja.top, width: caja.width }}
          className="z-50 rounded-md border bg-popover shadow-md"
        >
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-1 p-6 text-center text-sm text-muted-foreground">
              <Package className="h-6 w-6 opacity-40" />
              <span>No hay productos que coincidan</span>
            </div>
          ) : (
            <ul
              ref={listaRef}
              id="lista-productos"
              role="listbox"
              className="max-h-72 overflow-y-auto py-1"
            >
              {filtradas.map((o, i) => {
                // El encabezado se dibuja una sola vez, al cambiar de grupo.
                const abreCatalogo = hayCatalogo && i === 0 && o.delCatalogo;
                const abreResto =
                  !o.delCatalogo && (i === 0 || filtradas[i - 1].delCatalogo) && hayCatalogo;

                return (
                  <li key={o.key}>
                    {abreCatalogo && <Encabezado>{catalogoLabel}</Encabezado>}
                    {abreResto && <Encabezado>Otros productos</Encabezado>}
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === indice}
                      data-indice={i}
                      disabled={o.sinStock}
                      onMouseEnter={() => setMarcado(i)}
                      onClick={() => elegir(o)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                        o.sinStock && 'cursor-not-allowed opacity-50',
                        i === indice && !o.sinStock && 'bg-accent',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{o.producto.nombre}</span>
                          {o.presentacion ? (
                            <Badge
                              variant="outline"
                              className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                              {o.presentacion.nombre}
                            </Badge>
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              suelto
                            </span>
                          )}
                          {o.delCatalogo && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span>#{o.producto.codigo}</span>
                          <span>·</span>
                          <span>
                            Stock: {formatCantidad(o.producto.stockActual, o.producto.unidad)}
                          </span>
                          {o.presentacion && (
                            <>
                              <span>·</span>
                              <span>
                                {describirPresentacion(o.presentacion, o.producto.unidad)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm tabular-nums">
                          {formatCurrency(o.precio)}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {o.presentacion
                            ? `por ${o.presentacion.nombre.toLowerCase()}`
                            : `por ${abrevUnidad(o.producto.unidad)}`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function Encabezado({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}
