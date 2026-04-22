'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Cliente,
  CuentaCorriente,
  MedioPago,
  Producto,
  VentaItem,
} from '@/types';
import {
  createVenta,
  getCuentaByEntidad,
} from '@/lib/firebase-db';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { ClientePicker } from './cliente-picker';
import { ProductoPicker } from './producto-picker';
import { ItemsTable } from './items-table';
import { MediosPagoSelector } from './medios-pago-selector';

interface VentaFormProps {
  clientes: Cliente[];
  productos: Producto[];
}

export function VentaForm({ clientes, productos }: VentaFormProps) {
  const router = useRouter();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<VentaItem[]>([]);
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [comprobanteTipo, setComprobanteTipo] = useState('');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cuenta, setCuenta] = useState<CuentaCorriente | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId) || null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clienteId) {
        setCuenta(null);
        return;
      }
      const c = await getCuentaByEntidad(clienteId, 'cliente');
      if (!cancelled) setCuenta(c);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clienteId]);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.subtotal, 0),
    [items],
  );

  const stockExcedido = useMemo(() => {
    const prodById = new Map(productos.map((p) => [p.id, p]));
    return items.some((it) => {
      const p = prodById.get(it.productoId);
      return p ? it.cantidad > p.stockActual : false;
    });
  }, [items, productos]);

  const creditoAlerta = useMemo(() => {
    if (!cliente || !cuenta) return null;
    if (medioPago !== 'cuenta_corriente') return null;
    if (!cliente.limiteCredito) return null;
    const nuevoSaldo = cuenta.saldoActual + total;
    if (nuevoSaldo > cliente.limiteCredito) {
      return {
        limite: cliente.limiteCredito,
        nuevoSaldo,
        excedente: nuevoSaldo - cliente.limiteCredito,
      };
    }
    return null;
  }, [cliente, cuenta, total, medioPago]);

  function addItem(producto: Producto) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.productoId === producto.id);
      if (idx >= 0) {
        const next = [...prev];
        const cantidad = next[idx].cantidad + 1;
        next[idx] = {
          ...next[idx],
          cantidad,
          subtotal: cantidad * next[idx].precioUnitario,
        };
        return next;
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          productoCodigo: producto.codigo,
          productoNombre: producto.nombre,
          unidad: producto.unidad,
          cantidad: 1,
          precioUnitario: producto.precioVenta,
          subtotal: producto.precioVenta,
        },
      ];
    });
  }

  function updateItem(index: number, patch: Partial<VentaItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!cliente) {
      toast.error('Seleccioná un cliente');
      return;
    }
    if (items.length === 0) {
      toast.error('Agregá al menos un producto');
      return;
    }
    if (!medioPago) {
      toast.error('Seleccioná un medio de pago');
      return;
    }
    if (stockExcedido) {
      toast.error('Algunos items superan el stock disponible');
      return;
    }

    setSubmitting(true);
    try {
      const venta = await createVenta(
        {
          clienteId: cliente.id,
          fecha,
          items,
          total,
          medioPago,
          comprobanteTipo: comprobanteTipo || undefined,
          comprobanteNumero: comprobanteNumero || undefined,
          observaciones: observaciones || undefined,
        },
        cliente,
      );
      toast.success(`Venta #${venta.numero} registrada`);
      router.push(`/ventas/${venta.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la venta';
      toast.error(msg);
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(cliente) && items.length > 0 && Boolean(medioPago) && !submitting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/ventas" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva venta</h1>
            <p className="text-sm text-muted-foreground">
              Registrá una operación completa con stock y cobro
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente y fecha</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <ClientePicker
                  clientes={clientes}
                  value={clienteId}
                  onChange={setClienteId}
                />
                {cuenta && cliente && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Saldo actual:</span>
                    <BalanceDisplay
                      saldo={cuenta.saldoActual}
                      tipoEntidad="cliente"
                      size="sm"
                      showLabel={false}
                    />
                    {cliente.limiteCredito > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          Límite: {formatCurrency(cliente.limiteCredito)}
                        </span>
                      </>
                    )}
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
                excludeIds={items.map((it) => it.productoId)}
              />
              <ItemsTable
                items={items}
                productos={productos}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprobante y observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Notas internas, condiciones, etc."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Total a cobrar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-4xl font-bold tabular-nums">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Medio de pago *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediosPagoSelector value={medioPago} onChange={setMedioPago} />

              {medioPago === 'cuenta_corriente' && cuenta && cliente && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <Wallet className="h-3 w-3" />
                    Impacto en cuenta corriente
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo actual</span>
                      <span className="tabular-nums">{formatCurrency(cuenta.saldoActual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+ Venta</span>
                      <span className="tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Nuevo saldo</span>
                      <span className="tabular-nums">
                        {formatCurrency(cuenta.saldoActual + total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {creditoAlerta && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Supera el límite de crédito</AlertTitle>
                  <AlertDescription className="text-xs">
                    Nuevo saldo {formatCurrency(creditoAlerta.nuevoSaldo)} excede el límite de{' '}
                    {formatCurrency(creditoAlerta.limite)} por{' '}
                    {formatCurrency(creditoAlerta.excedente)}. Podés continuar de todos modos.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Button
            type="button"
            size="lg"
            className="w-full gap-2"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Confirmar venta
              </>
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}
