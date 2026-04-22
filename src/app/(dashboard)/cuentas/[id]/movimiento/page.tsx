'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CuentaCorriente, Cliente, Proveedor, TipoEntidad, ConceptoMovimiento } from '@/types';
import {
  getCuentasCorrientes,
  getClientes,
  getProveedores,
  addMovimiento,
} from '@/lib/firebase-db';
import { movimientoSchema, MovimientoSchemaType } from '@/lib/validators';
import { formatCurrency } from '@/lib/formatters';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  CreditCard,
  FileMinus,
  FilePlus,
  Sliders,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Truck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
}

type Operacion = {
  concepto: ConceptoMovimiento;
  tipo: 'debe' | 'haber';
  titulo: string;
  descripcion: string;
  icon: typeof ShoppingCart;
  effect: 'aumenta' | 'disminuye';
};

function getOperaciones(tipoEntidad: TipoEntidad): Operacion[] {
  if (tipoEntidad === 'proveedor') {
    return [
      {
        concepto: 'compra',
        tipo: 'haber',
        titulo: 'Compra / Factura recibida',
        descripcion: 'Aumenta lo que le debemos al proveedor',
        icon: ShoppingCart,
        effect: 'aumenta',
      },
      {
        concepto: 'pago',
        tipo: 'debe',
        titulo: 'Pago al proveedor',
        descripcion: 'Disminuye lo que le debemos',
        icon: CreditCard,
        effect: 'disminuye',
      },
      {
        concepto: 'nota_credito',
        tipo: 'debe',
        titulo: 'Nota de crédito',
        descripcion: 'El proveedor nos descuenta (disminuye deuda)',
        icon: FileMinus,
        effect: 'disminuye',
      },
      {
        concepto: 'nota_debito',
        tipo: 'haber',
        titulo: 'Nota de débito',
        descripcion: 'Recargo del proveedor (aumenta deuda)',
        icon: FilePlus,
        effect: 'aumenta',
      },
      {
        concepto: 'ajuste',
        tipo: 'haber',
        titulo: 'Ajuste',
        descripcion: 'Corrección manual del saldo',
        icon: Sliders,
        effect: 'aumenta',
      },
    ];
  }
  return [
    {
      concepto: 'venta',
      tipo: 'debe',
      titulo: 'Venta / Factura emitida',
      descripcion: 'Aumenta lo que nos debe el cliente',
      icon: ShoppingCart,
      effect: 'aumenta',
    },
    {
      concepto: 'cobro',
      tipo: 'haber',
      titulo: 'Cobro del cliente',
      descripcion: 'Disminuye lo que nos debe',
      icon: CreditCard,
      effect: 'disminuye',
    },
    {
      concepto: 'nota_credito',
      tipo: 'haber',
      titulo: 'Nota de crédito',
      descripcion: 'Le descontamos al cliente (disminuye deuda)',
      icon: FileMinus,
      effect: 'disminuye',
    },
    {
      concepto: 'nota_debito',
      tipo: 'debe',
      titulo: 'Nota de débito',
      descripcion: 'Recargo al cliente (aumenta deuda)',
      icon: FilePlus,
      effect: 'aumenta',
    },
    {
      concepto: 'ajuste',
      tipo: 'debe',
      titulo: 'Ajuste',
      descripcion: 'Corrección manual del saldo',
      icon: Sliders,
      effect: 'aumenta',
    },
  ];
}

function computeSaldoPosterior(
  saldoAnterior: number,
  tipoEntidad: TipoEntidad,
  tipo: 'debe' | 'haber',
  monto: number,
): number {
  if (tipoEntidad === 'cliente') {
    return tipo === 'debe' ? saldoAnterior + monto : saldoAnterior - monto;
  }
  return tipo === 'haber' ? saldoAnterior + monto : saldoAnterior - monto;
}

export default function NuevoMovimientoPage() {
  const params = useParams();
  const router = useRouter();
  const cuentaId = params.id as string;

  const [cuenta, setCuenta] = useState<CuentaConEntidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MovimientoSchemaType>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      cuentaId,
      tipo: 'debe',
      concepto: 'venta',
      descripcion: '',
      monto: 0,
      comprobanteNumero: '',
      comprobanteTipo: '',
      fecha: new Date().toISOString().split('T')[0],
    },
  });

  const concepto = watch('concepto');
  const tipo = watch('tipo');
  const monto = watch('monto') || 0;

  useEffect(() => {
    async function loadData() {
      try {
        const [cuentas, clientes, proveedores] = await Promise.all([
          getCuentasCorrientes(),
          getClientes(),
          getProveedores(),
        ]);

        const cuentaData = cuentas.find((c) => c.id === cuentaId);
        if (!cuentaData) {
          toast.error('Cuenta no encontrada');
          router.push('/cuentas');
          return;
        }

        let entidadNombre = 'N/A';
        if (cuentaData.tipoEntidad === 'cliente') {
          const cliente = clientes.find((c: Cliente) => c.id === cuentaData.entidadId);
          entidadNombre = cliente?.razonSocial || 'Cliente no encontrado';
          setValue('concepto', 'venta');
          setValue('tipo', 'debe');
        } else {
          const proveedor = proveedores.find((p: Proveedor) => p.id === cuentaData.entidadId);
          entidadNombre = proveedor?.razonSocial || 'Proveedor no encontrado';
          setValue('concepto', 'compra');
          setValue('tipo', 'haber');
        }

        setCuenta({ ...cuentaData, entidadNombre });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cuentaId, router, setValue]);

  const operaciones = useMemo(
    () => (cuenta ? getOperaciones(cuenta.tipoEntidad) : []),
    [cuenta],
  );

  const opActual = operaciones.find((o) => o.concepto === concepto);

  async function onSubmit(data: MovimientoSchemaType) {
    setIsSubmitting(true);
    try {
      await addMovimiento(data);
      toast.success('Movimiento registrado');
      if (cuenta?.tipoEntidad === 'cliente') {
        router.push(`/clientes/${cuenta.entidadId}`);
      } else {
        router.push(`/proveedores/${cuenta?.entidadId}`);
      }
    } catch (error) {
      console.error('Error creating movimiento:', error);
      toast.error('Error al registrar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectOperacion(op: Operacion) {
    setValue('concepto', op.concepto, { shouldValidate: true });
    setValue('tipo', op.tipo, { shouldValidate: true });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cuenta) return null;

  const saldoPosterior = computeSaldoPosterior(
    cuenta.saldoActual,
    cuenta.tipoEntidad,
    tipo,
    monto,
  );
  const EntityIcon = cuenta.tipoEntidad === 'proveedor' ? Truck : Users;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/${cuenta.tipoEntidad === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Nuevo movimiento
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{cuenta.entidadNombre}</h1>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                cuenta.tipoEntidad === 'proveedor'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
              )}
            >
              <EntityIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {cuenta.tipoEntidad === 'proveedor' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}
              </p>
              <p className="text-sm font-semibold">{cuenta.entidadNombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <BalanceDisplay
              saldo={cuenta.saldoActual}
              tipoEntidad={cuenta.tipoEntidad}
              size="lg"
              align="right"
            />
            {monto > 0 && opActual && (
              <>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Saldo después
                  </span>
                  <span
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      opActual.effect === 'aumenta'
                        ? cuenta.tipoEntidad === 'proveedor'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                        : 'text-muted-foreground',
                    )}
                  >
                    {formatCurrency(Math.abs(saldoPosterior))}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. ¿Qué tipo de operación es?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operaciones.map((op) => {
                const selected = op.concepto === concepto && op.tipo === tipo;
                const Icon = op.icon;
                const isAumenta = op.effect === 'aumenta';
                return (
                  <button
                    key={`${op.concepto}-${op.tipo}`}
                    type="button"
                    onClick={() => selectOperacion(op)}
                    className={cn(
                      'group flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition hover:border-primary/60 hover:shadow-sm',
                      selected && 'border-primary ring-2 ring-primary/20',
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-md',
                          isAumenta
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {isAumenta ? (
                        <ArrowUpCircle className="h-4 w-4 text-rose-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{op.titulo}</p>
                      <p className="text-xs text-muted-foreground">{op.descripcion}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Datos del movimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register('fecha')} disabled={isSubmitting} />
              {errors.fecha && (
                <p className="text-xs text-destructive">{errors.fecha.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-7 tabular-nums"
                  {...register('monto', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
              </div>
              {errors.monto && (
                <p className="text-xs text-destructive">{errors.monto.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder={
                  opActual?.concepto === 'compra'
                    ? 'Ej: Factura por reposición de insumos'
                    : opActual?.concepto === 'pago'
                      ? 'Ej: Pago por transferencia'
                      : 'Descripción del movimiento'
                }
                {...register('descripcion')}
                disabled={isSubmitting}
              />
              {errors.descripcion && (
                <p className="text-xs text-destructive">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comprobanteTipo">Tipo de comprobante</Label>
              <Input
                id="comprobanteTipo"
                placeholder="Factura A, Recibo X, etc."
                {...register('comprobanteTipo')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comprobanteNumero">Número</Label>
              <Input
                id="comprobanteNumero"
                placeholder="0001-00000001"
                {...register('comprobanteNumero')}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur">
            <div className="hidden text-xs text-muted-foreground sm:block">
              {opActual && monto > 0 ? (
                <>
                  Este movimiento{' '}
                  <span
                    className={cn(
                      'font-semibold',
                      opActual.effect === 'aumenta' ? 'text-rose-600' : 'text-emerald-600',
                    )}
                  >
                    {opActual.effect === 'aumenta' ? 'aumenta' : 'disminuye'}
                  </span>{' '}
                  el saldo en {formatCurrency(monto)}.
                </>
              ) : (
                'Seleccioná una operación e ingresá el monto.'
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || monto <= 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  'Registrar movimiento'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
