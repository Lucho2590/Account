'use client';

import { useMemo, useState } from 'react';
import { ItemCatalogo, Producto, Presentacion, UnidadBase, UNIDADES_BASE } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { abrevUnidad, describirPresentacion } from '@/lib/presentaciones';
import { sugerirCodigo } from '@/lib/codigos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Package, Plus, Search, Trash2 } from 'lucide-react';

interface CatalogoProveedorProps {
  items: ItemCatalogo[];
  productos: Producto[];
  onAgregar: (data: {
    productoId: string;
    presentacionId: string | null;
    costoPresentacion: number;
    codigoProveedor?: string;
  }) => Promise<void>;
  onQuitar: (id: string) => Promise<void>;
  /** Crea el producto y lo suma al catálogo en un solo paso. */
  onCrearProducto: (data: {
    nombre: string;
    codigo: string;
    unidad: UnidadBase;
    presentacionNombre: string;
    factor: number;
    costoPresentacion: number;
    codigoProveedor?: string;
  }) => Promise<void>;
}

const SIN_PRESENTACION = '__base__';

/**
 * Qué productos vende este proveedor, en qué presentación y a qué precio.
 *
 * El costo se carga por presentación (lo que sale la caja) y se muestra
 * también por unidad base, que es lo que permite comparar entre proveedores
 * que venden el mismo producto en formatos distintos.
 */
export function CatalogoProveedor({
  items,
  productos,
  onAgregar,
  onQuitar,
  onCrearProducto,
}: CatalogoProveedorProps) {
  const [open, setOpen] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [presentacionId, setPresentacionId] = useState(SIN_PRESENTACION);
  const [costo, setCosto] = useState('');
  const [codigoProveedor, setCodigoProveedor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);

  // Cuando llega una lista de precios, lo normal es que el producto todavía
  // no exista. Antes había que elegir entre "existente" y "nuevo" antes de
  // escribir nada; ahora se busca por nombre y, si no aparece, se crea con lo
  // mismo que ya se tipeó.
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [nuevaUnidad, setNuevaUnidad] = useState<UnidadBase>('unidad');
  const [nuevaPresentacion, setNuevaPresentacion] = useState('');
  const [nuevoFactor, setNuevoFactor] = useState('1');
  const [codigoTocado, setCodigoTocado] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  const producto = productos.find((p) => p.id === productoId) || null;
  const presentacion: Presentacion | null =
    producto && presentacionId !== SIN_PRESENTACION
      ? producto.presentaciones.find((x) => x.id === presentacionId) || null
      : null;

  const factor = presentacion?.factor ?? 1;
  const costoNum = Number(costo) || 0;

  const productosOrdenados = useMemo(
    () => [...productos].filter((p) => p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [productos],
  );

  // Los que ya están en el catálogo de este proveedor no se vuelven a ofrecer.
  const yaEnCatalogo = useMemo(() => new Set(items.map((i) => i.productoId)), [items]);

  const coincidencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return productosOrdenados
      .filter((p) => !yaEnCatalogo.has(p.id))
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [productosOrdenados, busqueda, yaEnCatalogo]);

  const nombreNuevo = busqueda.trim();

  // Sin este mapa, Base UI pinta el valor crudo y se veía "__base__".
  const etiquetasPresentacion: Record<string, string> = producto
    ? {
        [SIN_PRESENTACION]: `Suelto — de a ${abrevUnidad(producto.unidad)}`,
        ...Object.fromEntries(
          producto.presentaciones
            .filter((pr) => pr.nombre && pr.factor > 0)
            .map((pr) => [pr.id, describirPresentacion(pr, producto.unidad)]),
        ),
      }
    : {};

  // El código se propone solo; si lo editan a mano, deja de pisarse.
  const codigoSugerido = codigoTocado
    ? nuevoCodigo
    : sugerirCodigo(nombreNuevo, productos.map((p) => p.codigo));

  function limpiar() {
    setProductoId('');
    setPresentacionId(SIN_PRESENTACION);
    setCosto('');
    setCodigoProveedor('');
    setBusqueda('');
    setCreando(false);
    setNuevoCodigo('');
    setCodigoTocado(false);
    setNuevaUnidad('unidad');
    setNuevaPresentacion('');
    setNuevoFactor('1');
    setError(null);
  }

  async function guardar() {
    setError(null);

    if (creando) {
      if (!nombreNuevo) return setError('Poné el nombre del producto');
      if (!codigoSugerido.trim()) return setError('Poné un código');
      const factorNum = Number(nuevoFactor) || 0;
      if (nuevaPresentacion.trim() && factorNum <= 0) {
        return setError('La equivalencia de la presentación debe ser mayor a 0');
      }

      setGuardando(true);
      try {
        await onCrearProducto({
          nombre: nombreNuevo,
          codigo: codigoSugerido.trim(),
          unidad: nuevaUnidad,
          presentacionNombre: nuevaPresentacion.trim(),
          factor: factorNum,
          costoPresentacion: costoNum,
          codigoProveedor: codigoProveedor || undefined,
        });
        setOpen(false);
        limpiar();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo crear el producto');
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (!producto) return setError('Elegí un producto');
    setGuardando(true);
    try {
      await onAgregar({
        productoId: producto.id,
        presentacionId: presentacionId === SIN_PRESENTACION ? null : presentacionId,
        costoPresentacion: costoNum,
        codigoProveedor: codigoProveedor || undefined,
      });
      setOpen(false);
      limpiar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id: string) {
    setQuitando(id);
    try {
      await onQuitar(id);
    } finally {
      setQuitando(null);
    }
  }

  const unidadDe = (it: ItemCatalogo) =>
    productos.find((p) => p.id === it.productoId)?.unidad ?? 'unidad';

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Productos que vende</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lo que le comprás a este proveedor, con su presentación y su precio.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            limpiar();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar producto
        </Button>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Package className="h-7 w-7 opacity-40" />
            <p className="text-sm">
              Todavía no cargaste qué productos te vende este proveedor.
            </p>
          </div>
        ) : (
          <>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Presentación</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Por unidad</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => {
                const u = unidadDe(it);
                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      <span className="font-medium">{it.productoNombre}</span>
                      <span className="block text-xs text-muted-foreground">
                        #{it.productoCodigo}
                        {it.codigoProveedor && ` · su código: ${it.codigoProveedor}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {it.presentacionId ? (
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit">
                            {it.presentacionNombre}
                          </Badge>
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            = {it.factor} {abrevUnidad(u)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Suelto ({abrevUnidad(u)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(it.costoPresentacion)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(it.costoPresentacion / it.factor)} / {abrevUnidad(u)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => quitar(it.id)}
                        disabled={quitando === it.id}
                        aria-label={`Quitar ${it.productoNombre}`}
                      >
                        {quitando === it.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {items.map((it) => {
              const u = unidadDe(it);
              return (
                <div key={it.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{it.productoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        #{it.productoCodigo}
                        {it.codigoProveedor && ` · su código: ${it.codigoProveedor}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-2 -mt-1 shrink-0"
                      onClick={() => quitar(it.id)}
                      disabled={quitando === it.id}
                      aria-label={`Quitar ${it.productoNombre}`}
                    >
                      {quitando === it.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    {it.presentacionId ? (
                      <div>
                        <Badge variant="outline">{it.presentacionNombre}</Badge>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          = {it.factor} {abrevUnidad(u)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Suelto ({abrevUnidad(u)})
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(it.costoPresentacion)}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(it.costoPresentacion / it.factor)} / {abrevUnidad(u)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => !guardando && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar producto al catálogo</DialogTitle>
            <DialogDescription>
              Buscá el producto; si todavía no lo tenés, lo creás acá mismo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Un solo campo: se busca por nombre y, si no está, se crea con lo
                mismo que ya se escribió. */}
            {!producto && !creando && (
              <div className="space-y-2">
                <Label htmlFor="buscar">¿Qué producto te vende?</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="buscar"
                    autoFocus
                    placeholder="Escribí el nombre…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    disabled={guardando}
                    className="pl-9"
                  />
                </div>

                {nombreNuevo && (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                    {coincidencias.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProductoId(p.id);
                          setPresentacionId(SIN_PRESENTACION);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.nombre}</span>
                          <span className="block text-xs text-muted-foreground">
                            #{p.codigo} · se mide en {abrevUnidad(p.unidad)}
                          </span>
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          Ya existe
                        </Badge>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCreando(true)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">
                        Crear <span className="font-medium">«{nombreNuevo}»</span>
                      </span>
                    </button>
                  </div>
                )}

                {!nombreNuevo && (
                  <p className="text-xs text-muted-foreground">
                    Si todavía no lo tenés cargado, lo creás desde acá mismo.
                  </p>
                )}
              </div>
            )}

            {/* Elegido o recién creado, se muestra arriba y se puede cambiar. */}
            {(producto || creando) && (
              <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {producto ? producto.nombre : nombreNuevo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {producto ? `#${producto.codigo} · ya existía` : 'Producto nuevo'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={guardando}
                  onClick={() => {
                    setProductoId('');
                    setCreando(false);
                  }}
                >
                  Cambiar
                </Button>
              </div>
            )}

            {creando && (
              <>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="ncodigo">Código</Label>
                    <Input
                      id="ncodigo"
                      value={codigoSugerido}
                      onChange={(e) => {
                        setCodigoTocado(true);
                        setNuevoCodigo(e.target.value);
                      }}
                      disabled={guardando}
                    />
                    <p className="text-xs text-muted-foreground">
                      {codigoTocado ? 'Lo elegiste vos.' : 'Sugerido, podés cambiarlo.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Se mide en *</Label>
                    <Select
                    value={nuevaUnidad}
                    onValueChange={(v) => setNuevaUnidad((v as UnidadBase) ?? 'unidad')}
                    disabled={guardando}
                    items={Object.fromEntries(
                      UNIDADES_BASE.map((x) => [x.value, `${x.label} (${x.abrev})`]),
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_BASE.map((x) => (
                        <SelectItem key={x.value} value={x.value}>
                          {x.label} ({x.abrev})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    En esta unidad se va a llevar el stock.
                  </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-2">
                    <Label htmlFor="npres">Te lo vende por</Label>
                    <Input
                      id="npres"
                      placeholder="Ej: Caja, Balde (vacío = suelto)"
                      value={nuevaPresentacion}
                      onChange={(e) => setNuevaPresentacion(e.target.value)}
                      disabled={guardando}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nfactor">
                      Equivale a ({UNIDADES_BASE.find((x) => x.value === nuevaUnidad)?.abrev})
                    </Label>
                    <Input
                      id="nfactor"
                      type="number"
                      min={0}
                      step="0.001"
                      inputMode="decimal"
                      value={nuevoFactor}
                      onChange={(e) => setNuevoFactor(e.target.value)}
                      disabled={guardando || !nuevaPresentacion.trim()}
                    />
                  </div>
                </div>

                {nuevaPresentacion.trim() && Number(nuevoFactor) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    1 {nuevaPresentacion.trim().toLowerCase()} = {nuevoFactor}{' '}
                    {UNIDADES_BASE.find((x) => x.value === nuevaUnidad)?.abrev}
                  </p>
                )}
              </>
            )}

            {producto && (
              <div className="space-y-2">
                <Label>Presentación</Label>
                <Select
                  value={presentacionId}
                  onValueChange={(v) => setPresentacionId(v ?? SIN_PRESENTACION)}
                  disabled={guardando}
                  items={etiquetasPresentacion}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_PRESENTACION}>
                      Suelto — de a {abrevUnidad(producto.unidad)}
                    </SelectItem>
                    {producto.presentaciones
                      .filter((pr) => pr.nombre && pr.factor > 0)
                      .map((pr) => (
                        <SelectItem key={pr.id} value={pr.id}>
                          {describirPresentacion(pr, producto.unidad)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {producto.presentaciones.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Este producto no tiene presentaciones cargadas. Podés agregarlas
                    desde su ficha.
                  </p>
                )}
              </div>
            )}

            {/* Hasta que no hay producto, el costo no tiene por qué estar: la
                etiqueta depende de la presentación que todavía no se eligió. */}
            {(producto || creando) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costo">
                  Costo{' '}
                  {creando
                    ? nuevaPresentacion.trim()
                      ? `por ${nuevaPresentacion.trim().toLowerCase()}`
                      : 'por unidad'
                    : presentacion
                      ? `por ${presentacion.nombre.toLowerCase()}`
                      : 'por unidad'}{' '}
                  *
                </Label>
                <Input
                  id="costo"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  disabled={guardando}
                />
                {producto && costoNum > 0 && factor > 1 && (
                  <p className="text-xs text-muted-foreground">
                    = {formatCurrency(costoNum / factor)} por {abrevUnidad(producto.unidad)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="codprov">Código del proveedor</Label>
                <Input
                  id="codprov"
                  placeholder="Opcional"
                  value={codigoProveedor}
                  onChange={(e) => setCodigoProveedor(e.target.value)}
                  disabled={guardando}
                />
              </div>
            </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando || (!producto && !creando)}
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Agregar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
