'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrdenCompra, Producto, MedioPago } from '@/types';
import { registrarRecepcion } from '@/lib/firebase-db';
import { useEmpresaId } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediosPagoSelector } from '@/components/shared/medios-pago-selector';
import { CostosDistintos } from './costos-distintos';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface RecepcionFormProps {
  orden: OrdenCompra;
  productos: Producto[];
}

type LineaRecepcion = {
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  unidad: string;
  pendiente: number;
  cantidad: number;
  costoUnitario: number;
};

export function RecepcionForm({ orden, productos }: RecepcionFormProps) {
  const empresaId = useEmpresaId();
  const router = useRouter();

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [comprobanteTipo, setComprobanteTipo] = useState('');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Por defecto se recibe todo lo que falta, al costo pactado en la orden:
  // es lo que pasa la mayoría de las veces.
  const [lineas, setLineas] = useState<LineaRecepcion[]>(() =>
    orden.items
      .map((it) => ({
        productoId: it.productoId,
        productoCodigo: it.productoCodigo,
        productoNombre: it.productoNombre,
        unidad: it.unidad,
        pendiente: it.cantidad - it.cantidadRecibida,
        cantidad: it.cantidad - it.cantidadRecibida,
        costoUnitario: it.costoUnitario,
      }))
      .filter((l) => l.pendiente > 0),
  );

  const [actualizarCostoDe, setActualizarCostoDe] = useState<string[]>([]);

  const total = useMemo(
    () => lineas.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0),
    [lineas],
  );

  const costosDistintos = useMemo(() => {
    const porId = new Map(productos.map((p) => [p.id, p]));
    return lineas
      .filter((l) => l.cantidad > 0)
      .map((l) => {
        const p = porId.get(l.productoId);
        if (!p || p.precioCompra === l.costoUnitario) return null;
        return {
          productoId: l.productoId,
          productoNombre: l.productoNombre,
          costoAnterior: p.precioCompra,
          costoNuevo: l.costoUnitario,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [lineas, productos]);

  // Arranca aceptado: pagar otro precio normalmente significa que el costo cambió.
  const aceptados = useMemo(() => {
    const vigentes = costosDistintos.map((c) => c.productoId);
    const rechazados = vigentes.filter((id) => actualizarCostoDe.includes(`no:${id}`));
    return vigentes.filter((id) => !rechazados.includes(id));
  }, [costosDistintos, actualizarCostoDe]);

  const toggleCosto = (id: string) =>
    setActualizarCostoDe((prev) =>
      prev.includes(`no:${id}`) ? prev.filter((x) => x !== `no:${id}`) : [...prev, `no:${id}`],
    );

  const actualizar = (idx: number, patch: Partial<LineaRecepcion>) =>
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  async function handleSubmit() {
    const recibidos = lineas.filter((l) => l.cantidad > 0);
    if (recibidos.length === 0) return toast.error('Indicá al menos un producto recibido');
    if (!medioPago) return toast.error('Elegí el medio de pago');

    const excede = recibidos.find((l) => l.cantidad > l.pendiente);
    if (excede) {
      return toast.error(
        `De "${excede.productoNombre}" quedan ${excede.pendiente} pendientes`,
      );
    }

    setSubmitting(true);
    try {
      const recepcion = await registrarRecepcion(empresaId, orden.id, {
        fecha,
        items: recibidos.map((l) => ({
          productoId: l.productoId,
          productoCodigo: l.productoCodigo,
          productoNombre: l.productoNombre,
          unidad: l.unidad,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
          subtotal: l.cantidad * l.costoUnitario,
          actualizoCosto: aceptados.includes(l.productoId),
        })),
        total,
        medioPago,
        comprobanteTipo: comprobanteTipo || undefined,
        comprobanteNumero: comprobanteNumero || undefined,
      });
      toast.success(`Recepción #${recepcion.numero} registrada`);
      router.push(`/compras/${orden.id}/recepciones/${recepcion.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar la recepción');
      setSubmitting(false);
    }
  }

  if (lineas.length === 0) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/compras/${orden.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la orden
          </Link>
        </Button>
        <p className="text-muted-foreground">Esta orden ya recibió toda su mercadería.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/compras/${orden.id}`} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Recibir mercadería</h1>
          <p className="text-sm text-muted-foreground">
            Orden #{orden.numero} · {orden.proveedorNombre}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">¿Qué llegó?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Viene cargado todo lo pendiente. Ajustá las cantidades si la entrega
                fue parcial, o el costo si el proveedor facturó otro precio.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineas.map((l, idx) => (
                <div key={l.productoId} className="rounded-md border p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{l.productoNombre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      pendiente: {l.pendiente} {l.unidad}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Cantidad</Label>
                      <Input
                        type="number"
                        min={0}
                        max={l.pendiente}
                        step="0.01"
                        inputMode="decimal"
                        value={l.cantidad}
                        onChange={(e) =>
                          actualizar(idx, { cantidad: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Costo unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={l.costoUnitario}
                        onChange={(e) =>
                          actualizar(idx, { costoUnitario: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-right text-sm tabular-nums">
                    {formatCurrency(l.cantidad * l.costoUnitario)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {costosDistintos.length > 0 && (
            <CostosDistintos
              cambios={costosDistintos}
              aceptados={aceptados}
              onToggle={toggleCosto}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprobante</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[180px_1fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctipo">Tipo</Label>
                <Input
                  id="ctipo"
                  placeholder="Ej: Factura A"
                  value={comprobanteTipo}
                  onChange={(e) => setComprobanteTipo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnum">Número</Label>
                <Input
                  id="cnum"
                  placeholder="Ej: 0001-00001234"
                  value={comprobanteNumero}
                  onChange={(e) => setComprobanteNumero(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total de esta entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{formatCurrency(total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medio de pago *</CardTitle>
            </CardHeader>
            <CardContent>
              <MediosPagoSelector value={medioPago} onChange={setMedioPago} modo="compra" />
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={submitting || total <= 0 || !medioPago}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Confirmar recepción'
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}
