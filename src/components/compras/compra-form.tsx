'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Proveedor,
  Producto,
  VentaItem,
  MedioPago,
  CuentaCorriente,
  Presentacion,
  ItemCatalogo,
} from '@/types';
import { createOrdenCompra, compraDirecta, getCuentaByEntidad } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { armarItem, recalcularItem } from '@/lib/presentaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { EntidadPicker } from '@/components/shared/entidad-picker';
import { ProductoPicker, claveItem } from '@/components/shared/producto-picker';
import { ItemsTable } from '@/components/shared/items-table';
import { MediosPagoSelector } from '@/components/shared/medios-pago-selector';
import { CostosDistintos } from './costos-distintos';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Truck } from 'lucide-react';

interface CompraFormProps {
  proveedores: Proveedor[];
  productos: Producto[];
  /** Catálogo completo; se filtra por el proveedor elegido. */
  catalogo: ItemCatalogo[];
  /**
   * `orden` solo deja el pedido asentado. `directa` además da la mercadería
   * por recibida: suma stock y genera la deuda en el acto.
   */
  modo: 'orden' | 'directa';
}

export function CompraForm({ proveedores, productos, catalogo, modo }: CompraFormProps) {
  const empresaId = useEmpresaId();
  const router = useRouter();

  const [proveedorId, setProveedorId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [items, setItems] = useState<VentaItem[]>([]);
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [comprobanteTipo, setComprobanteTipo] = useState('');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [observaciones, setObservaciones] = useState('');
  // Se guarda junto al proveedor que la resolvió: así cambiar de proveedor no
  // necesita limpiar el estado dentro del efecto, y nunca se ve el saldo del
  // proveedor anterior mientras carga el nuevo.
  const [cuentaResuelta, setCuentaResuelta] = useState<{
    proveedorId: string;
    cuenta: CuentaCorriente | null;
  } | null>(null);
  const [costosRechazados, setCostosRechazados] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const esDirecta = modo === 'directa';
  const proveedor = proveedores.find((p) => p.id === proveedorId) || null;

  const cuenta =
    cuentaResuelta && cuentaResuelta.proveedorId === proveedorId ? cuentaResuelta.cuenta : null;

  useEffect(() => {
    if (!proveedorId) return;
    let cancelado = false;

    getCuentaByEntidad(empresaId, proveedorId, 'proveedor')
      .then((c) => {
        if (!cancelado) setCuentaResuelta({ proveedorId, cuenta: c });
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [proveedorId, empresaId]);

  const total = useMemo(() => items.reduce((sum, it) => sum + it.subtotal, 0), [items]);

  // Lo que este proveedor vende, con su presentación y su precio. Es el
  // camino rápido: evita buscar el producto y tipear el costo a mano.
  const delProveedor = useMemo(
    () => (proveedorId ? catalogo.filter((c) => c.proveedorId === proveedorId && c.activo) : []),
    [catalogo, proveedorId],
  );

  // Los productos cuyo costo pactado difiere del que tiene la ficha. Solo
  // importa en la compra directa: en una orden todavía no se recibió nada.
  const costosDistintos = useMemo(() => {
    if (!esDirecta) return [];
    const porId = new Map(productos.map((p) => [p.id, p]));
    return items
      .map((it) => {
        const p = porId.get(it.productoId);
        if (!p || p.precioCompra === it.precioUnitario) return null;
        return {
          productoId: it.productoId,
          productoNombre: it.productoNombre,
          costoAnterior: p.precioCompra,
          costoNuevo: it.precioUnitario,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [items, productos, esDirecta]);

  // Se lleva la lista de rechazados y se derivan los aceptados, en vez de
  // sincronizar un estado con un efecto: así un producto nuevo queda aceptado
  // por defecto sin que haga falta escribir estado en cada render.
  const actualizarCostoDe = useMemo(
    () =>
      costosDistintos
        .map((c) => c.productoId)
        .filter((id) => !costosRechazados.includes(id)),
    [costosDistintos, costosRechazados],
  );

  function addItem(
    producto: Producto,
    presentacion: Presentacion | null,
    precioPresentacion?: number,
  ) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.productoId === producto.id && (it.presentacion ?? null) === (presentacion?.nombre ?? null),
      );
      if (idx >= 0) {
        const next = [...prev];
        const actual = next[idx];
        next[idx] = {
          ...actual,
          ...recalcularItem(actual, {
            cantidadPresentacion: (actual.cantidadPresentacion ?? actual.cantidad) + 1,
          }),
        };
        return next;
      }
      return [
        ...prev,
        // El precio de referencia al comprar es el costo, no el de venta.
        armarItem({
          producto,
          presentacion,
          cantidadPresentacion: 1,
          // El del catálogo manda: es lo que cobra este proveedor en
          // particular. Si no está, se cae al costo de la ficha.
          precioPresentacion:
            precioPresentacion ?? producto.precioCompra * (presentacion?.factor ?? 1),
        }),
      ];
    });
  }

  const updateItem = (index: number, patch: Partial<VentaItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  async function handleSubmit() {
    if (!proveedor) return toast.error('Elegí un proveedor');
    if (items.length === 0) return toast.error('Agregá al menos un producto');
    if (esDirecta && !medioPago) return toast.error('Elegí el medio de pago');

    setSubmitting(true);
    try {
      const base = {
        proveedorId: proveedor.id,
        fecha,
        fechaEntregaEstimada: fechaEntrega || undefined,
        items: items.map((it) => ({ ...it, costoUnitario: it.precioUnitario })),
        total,
        observaciones: observaciones || undefined,
      };

      if (esDirecta) {
        const { orden } = await compraDirecta(
          empresaId,
          {
            ...base,
            medioPago: medioPago as MedioPago,
            comprobanteTipo: comprobanteTipo || undefined,
            comprobanteNumero: comprobanteNumero || undefined,
            actualizarCostoDe,
          },
          proveedor,
        );
        toast.success(`Compra #${orden.numero} registrada`);
        router.push(`/compras/${orden.id}`);
      } else {
        const orden = await createOrdenCompra(empresaId, base, proveedor);
        toast.success(`Orden #${orden.numero} creada`);
        router.push(`/compras/${orden.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar la compra');
      setSubmitting(false);
    }
  }

  const canSubmit =
    Boolean(proveedor) && items.length > 0 && (!esDirecta || Boolean(medioPago)) && !submitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/compras" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {esDirecta ? 'Compra directa' : 'Nueva orden de compra'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {esDirecta
              ? 'La mercadería ya llegó: suma stock y genera la deuda ahora'
              : 'Un pedido al proveedor; el stock entra cuando lo recibas'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proveedor y fechas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <EntidadPicker
                  entidades={proveedores}
                  value={proveedorId}
                  onChange={setProveedorId}
                  placeholder="Seleccioná un proveedor…"
                  tituloDialog="Seleccionar proveedor"
                  icon={Truck}
                />
                {cuenta && proveedor && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Saldo actual:</span>
                    <BalanceDisplay
                      saldo={cuenta.saldoActual}
                      tipoEntidad="proveedor"
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              {!esDirecta && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="entrega">Entrega estimada</Label>
                  <Input
                    id="entrega"
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductoPicker
                productos={productos}
                onSelect={addItem}
                excludeKeys={items.map((it) => claveItem(it.productoId, it.presentacion ?? null))}
                precioField="precioCompra"
                bloquearSinStock={false}
                catalogo={delProveedor}
                catalogoLabel={`Lo que vende ${proveedor?.razonSocial ?? 'el proveedor'}`}
                placeholder="Buscá un producto para agregar…"
              />
              <ItemsTable
                items={items}
                productos={productos}
                onUpdate={updateItem}
                onRemove={removeItem}
                validarStock={false}
                labelPrecio="Costo unit."
              />
            </CardContent>
          </Card>

          {esDirecta && costosDistintos.length > 0 && (
            <CostosDistintos
              cambios={costosDistintos}
              aceptados={actualizarCostoDe}
              onToggle={(id) =>
                setCostosRechazados((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprobante y observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {esDirecta && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="comprobanteTipo">Tipo de comprobante</Label>
                    <Input
                      id="comprobanteTipo"
                      placeholder="Ej: Factura A"
                      value={comprobanteTipo}
                      onChange={(e) => setComprobanteTipo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comprobanteNumero">Número</Label>
                    <Input
                      id="comprobanteNumero"
                      placeholder="Ej: 0001-00001234"
                      value={comprobanteNumero}
                      onChange={(e) => setComprobanteNumero(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                  id="observaciones"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {esDirecta ? 'Total a pagar' : 'Total de la orden'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{formatCurrency(total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </p>
            </CardContent>
          </Card>

          {esDirecta && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medio de pago *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MediosPagoSelector value={medioPago} onChange={setMedioPago} modo="compra" />
                {medioPago === 'cuenta_corriente' && cuenta && (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Impacto en la cuenta
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo actual</span>
                      <span className="tabular-nums">{formatCurrency(cuenta.saldoActual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+ Compra</span>
                      <span className="tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                      <span>Nuevo saldo</span>
                      <span className="tabular-nums">
                        {formatCurrency(cuenta.saldoActual + total)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : esDirecta ? (
              'Confirmar compra'
            ) : (
              'Crear orden'
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}
