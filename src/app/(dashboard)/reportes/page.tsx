'use client';

import { useEffect, useState } from 'react';
import { CuentaCorriente, Cliente, Proveedor, Movimiento } from '@/types';
import {
  getCuentasCorrientes,
  getClientes,
  getProveedores,
  getMovimientosByCuenta,
} from '@/lib/firebase-db';
import { generateEstadoCuentaPDF, generateCuentasResumenPDF } from '@/lib/pdf-generator';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface CuentaConEntidad extends CuentaCorriente {
  entidadNombre: string;
}

export default function ReportesPage() {
  const [cuentas, setCuentas] = useState<CuentaConEntidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<'cliente' | 'proveedor'>('cliente');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [cuentasData, clientesData, proveedoresData] = await Promise.all([
        getCuentasCorrientes(),
        getClientes(),
        getProveedores(),
      ]);

      const cuentasConEntidad: CuentaConEntidad[] = cuentasData.map((cuenta) => {
        let entidadNombre = 'N/A';
        if (cuenta.tipoEntidad === 'cliente') {
          const cliente = clientesData.find((c) => c.id === cuenta.entidadId);
          entidadNombre = cliente?.razonSocial || 'Cliente no encontrado';
        } else {
          const proveedor = proveedoresData.find((p) => p.id === cuenta.entidadId);
          entidadNombre = proveedor?.razonSocial || 'Proveedor no encontrado';
        }
        return { ...cuenta, entidadNombre };
      });

      setCuentas(cuentasConEntidad);
      setClientes(clientesData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateEstadoCuenta() {
    if (!selectedEntidad) {
      toast.error('Selecciona un cliente o proveedor');
      return;
    }

    setGeneratingPDF(true);
    try {
      const cuenta = cuentas.find(
        (c) => c.entidadId === selectedEntidad && c.tipoEntidad === selectedTipo
      );

      if (!cuenta) {
        toast.error('Cuenta no encontrada');
        return;
      }

      const entidad =
        selectedTipo === 'cliente'
          ? clientes.find((c) => c.id === selectedEntidad)
          : proveedores.find((p) => p.id === selectedEntidad);

      if (!entidad) {
        toast.error('Entidad no encontrada');
        return;
      }

      const movimientos = await getMovimientosByCuenta(cuenta.id);

      generateEstadoCuentaPDF({
        entidad,
        cuenta,
        movimientos,
        tipoEntidad: selectedTipo,
      });

      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGeneratingPDF(false);
    }
  }

  function handleGenerateCuentasCobrar() {
    const cuentasClientes = cuentas
      .filter((c) => c.tipoEntidad === 'cliente' && c.saldoActual > 0)
      .map((c) => ({
        entidadNombre: c.entidadNombre,
        saldoActual: c.saldoActual,
        tipoEntidad: 'cliente' as const,
      }));

    if (cuentasClientes.length === 0) {
      toast.error('No hay cuentas por cobrar');
      return;
    }

    generateCuentasResumenPDF({
      cuentas: cuentasClientes,
      tipo: 'cobrar',
    });

    toast.success('PDF generado correctamente');
  }

  function handleGenerateCuentasPagar() {
    const cuentasProveedores = cuentas
      .filter((c) => c.tipoEntidad === 'proveedor' && c.saldoActual > 0)
      .map((c) => ({
        entidadNombre: c.entidadNombre,
        saldoActual: c.saldoActual,
        tipoEntidad: 'proveedor' as const,
      }));

    if (cuentasProveedores.length === 0) {
      toast.error('No hay cuentas por pagar');
      return;
    }

    generateCuentasResumenPDF({
      cuentas: cuentasProveedores,
      tipo: 'pagar',
    });

    toast.success('PDF generado correctamente');
  }

  const entidades = selectedTipo === 'cliente' ? clientes : proveedores;

  const totalCobrar = cuentas
    .filter((c) => c.tipoEntidad === 'cliente' && c.saldoActual > 0)
    .reduce((sum, c) => sum + c.saldoActual, 0);

  const totalPagar = cuentas
    .filter((c) => c.tipoEntidad === 'proveedor' && c.saldoActual > 0)
    .reduce((sum, c) => sum + c.saldoActual, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Reportes</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Genera reportes y estados de cuenta en PDF
        </p>
      </div>

      <Tabs defaultValue="individual">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="individual" className="flex-1 sm:flex-initial">
            Individual
          </TabsTrigger>
          <TabsTrigger value="listados" className="flex-1 sm:flex-initial">
            Listados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estado de Cuenta
              </CardTitle>
              <CardDescription>
                Genera un estado de cuenta detallado para un cliente o proveedor específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Entidad</Label>
                  <Select
                    value={selectedTipo}
                    onValueChange={(value) => {
                      setSelectedTipo(value as 'cliente' | 'proveedor');
                      setSelectedEntidad('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="proveedor">Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Seleccionar {selectedTipo === 'cliente' ? 'Cliente' : 'Proveedor'}</Label>
                  <Select value={selectedEntidad} onValueChange={(value) => setSelectedEntidad(value || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar ${selectedTipo}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {entidades.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.razonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateEstadoCuenta}
                disabled={!selectedEntidad || generatingPDF}
                className="w-full md:w-auto"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generar PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listados" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Cuentas por Cobrar
                </CardTitle>
                <CardDescription>
                  Listado de todos los clientes con saldo pendiente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total a Cobrar</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(totalCobrar)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cuentas.filter((c) => c.tipoEntidad === 'cliente' && c.saldoActual > 0).length}{' '}
                  clientes con saldo pendiente
                </p>
                <Button onClick={handleGenerateCuentasCobrar} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Listado
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Cuentas por Pagar
                </CardTitle>
                <CardDescription>
                  Listado de todos los proveedores a los que se les debe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total a Pagar</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(totalPagar)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cuentas.filter((c) => c.tipoEntidad === 'proveedor' && c.saldoActual > 0).length}{' '}
                  proveedores acreedores
                </p>
                <Button onClick={handleGenerateCuentasPagar} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Listado
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
