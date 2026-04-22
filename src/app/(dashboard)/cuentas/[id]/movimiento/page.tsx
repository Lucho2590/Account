'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CuentaCorriente, Cliente, Proveedor } from '@/types';
import { getCuentasCorrientes, getClientes, getProveedores, addMovimiento } from '@/lib/firebase-db';
import { movimientoSchema, MovimientoSchemaType } from '@/lib/validators';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
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

  const tipo = watch('tipo');
  const concepto = watch('concepto');

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
        } else {
          const proveedor = proveedores.find((p: Proveedor) => p.id === cuentaData.entidadId);
          entidadNombre = proveedor?.razonSocial || 'Proveedor no encontrado';
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
  }, [cuentaId, router]);

  async function onSubmit(data: MovimientoSchemaType) {
    setIsSubmitting(true);
    try {
      await addMovimiento(data);
      toast.success('Movimiento registrado correctamente');

      // Volver a la página de la entidad
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cuenta) {
    return null;
  }

  const conceptosCliente = [
    { value: 'venta', label: 'Venta' },
    { value: 'cobro', label: 'Cobro' },
    { value: 'nota_credito', label: 'Nota de Crédito' },
    { value: 'nota_debito', label: 'Nota de Débito' },
    { value: 'ajuste', label: 'Ajuste' },
  ];

  const conceptosProveedor = [
    { value: 'compra', label: 'Compra' },
    { value: 'pago', label: 'Pago' },
    { value: 'nota_credito', label: 'Nota de Crédito' },
    { value: 'nota_debito', label: 'Nota de Débito' },
    { value: 'ajuste', label: 'Ajuste' },
  ];

  const conceptos = cuenta.tipoEntidad === 'cliente' ? conceptosCliente : conceptosProveedor;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/${cuenta.tipoEntidad === 'cliente' ? 'clientes' : 'proveedores'}/${cuenta.entidadId}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Movimiento</h1>
          <p className="text-muted-foreground">{cuenta.entidadNombre}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de la Cuenta</CardTitle>
          <CardDescription>
            Saldo actual:{' '}
            <span
              className={`font-bold ${
                cuenta.saldoActual > 0
                  ? cuenta.tipoEntidad === 'cliente'
                    ? 'text-green-600'
                    : 'text-red-600'
                  : ''
              }`}
            >
              {formatCurrency(cuenta.saldoActual)}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del Movimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                {...register('fecha')}
                disabled={isSubmitting}
              />
              {errors.fecha && (
                <p className="text-sm text-destructive">{errors.fecha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={tipo}
                onValueChange={(value) =>
                  setValue('tipo', value as MovimientoSchemaType['tipo'])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debe">Debe (aumenta saldo)</SelectItem>
                  <SelectItem value="haber">Haber (disminuye saldo)</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto *</Label>
              <Select
                value={concepto}
                onValueChange={(value) =>
                  setValue('concepto', value as MovimientoSchemaType['concepto'])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent>
                  {conceptos.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.concepto && (
                <p className="text-sm text-destructive">{errors.concepto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                min="0.01"
                step="0.01"
                {...register('monto', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.monto && (
                <p className="text-sm text-destructive">{errors.monto.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Input
                id="descripcion"
                placeholder="Descripción del movimiento"
                {...register('descripcion')}
                disabled={isSubmitting}
              />
              {errors.descripcion && (
                <p className="text-sm text-destructive">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comprobanteTipo">Tipo de Comprobante</Label>
              <Input
                id="comprobanteTipo"
                placeholder="Factura, Recibo, etc."
                {...register('comprobanteTipo')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comprobanteNumero">Número de Comprobante</Label>
              <Input
                id="comprobanteNumero"
                placeholder="0001-00000001"
                {...register('comprobanteNumero')}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Movimiento'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
