'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Proveedor, CuentaCorriente, Movimiento, ItemCatalogo, Producto, OrdenCompra } from '@/types';
import {
  getCatalogoProveedor,
  getProductos,
  addItemCatalogo,
  deleteItemCatalogo,
  addProducto,
  getOrdenesCompra,
  getProveedor,
  getCuentaByEntidad,
  getMovimientosByCuenta,
} from '@/lib/firebase-db';
import {
  formatCUIT,
  formatCondicionIva,
  formatCBU,
} from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BalanceDisplay } from '@/components/cuentas/balance-display';
import { MovimientosTable } from '@/components/cuentas/movimientos-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrdenesTable } from '@/components/compras/ordenes-table';
import { CatalogoProveedor } from '@/components/proveedores/catalogo-proveedor';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Loader2,
  Truck,
  Phone,
  Mail,
  MapPin,
  Building2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresaId } from '@/contexts/AuthContext';

export default function ProveedorDetailPage() {
  const empresaId = useEmpresaId();
  const params = useParams();
  const id = params.id as string;

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [cuenta, setCuenta] = useState<CuentaCorriente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const proveedorData = await getProveedor(empresaId, id);
        if (!proveedorData) {
          toast.error('Proveedor no encontrado');
          return;
        }
        setProveedor(proveedorData);

        const [cat, prods, todasLasOrdenes] = await Promise.all([
          getCatalogoProveedor(empresaId, id),
          getProductos(empresaId),
          getOrdenesCompra(empresaId),
        ]);
        setCatalogo(cat);
        setProductos(prods);
        setOrdenes(todasLasOrdenes.filter((o) => o.proveedorId === id));

        const cuentaData = await getCuentaByEntidad(empresaId, id, 'proveedor');
        if (cuentaData) {
          setCuenta(cuentaData);
          const movimientosData = await getMovimientosByCuenta(empresaId, cuentaData.id);
          setMovimientos(movimientosData);
        }
      } catch (error) {
        console.error('Error loading proveedor:', error);
        toast.error('Error al cargar los datos del proveedor');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, empresaId]);

  function copiar(value: string, label: string) {
    navigator.clipboard.writeText(value).then(() => toast.success(`${label} copiado`));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/proveedores">Volver a proveedores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/proveedores">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Proveedor
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{proveedor.razonSocial}</h1>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>CUIT {formatCUIT(proveedor.cuit)}</span>
                <span>·</span>
                <span>{formatCondicionIva(proveedor.condicionIva)}</span>
                <Badge variant={proveedor.activo ? 'default' : 'secondary'} className="ml-1">
                  {proveedor.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/proveedores/${id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {cuenta && (
            <Button asChild>
              <Link href={`/cuentas/${cuenta.id}/movimiento`}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo movimiento
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Saldo en cuenta corriente
              </p>
              <BalanceDisplay
                saldo={cuenta?.saldoActual || 0}
                tipoEntidad="proveedor"
                size="xl"
                showLabel={false}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {(cuenta?.saldoActual || 0) > 0
                  ? 'Monto pendiente de pago al proveedor'
                  : (cuenta?.saldoActual || 0) < 0
                    ? 'Anticipo a favor del proveedor'
                    : 'La cuenta está al día'}
              </p>
            </div>
            {cuenta && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Movimientos
                </p>
                <p className="text-2xl font-bold tabular-nums">{movimientos.length}</p>
              </div>
            )}
          </CardContent>
      </Card>

      {/* Cada cosa en su pestaña: los datos del proveedor, lo que te vende y
          el movimiento de la cuenta son consultas distintas y antes convivían
          en una sola tirada de scroll. */}
      <Tabs defaultValue="productos">
        {/* En un teléfono las cuatro etiquetas completas no entran: se acorta
            "Cuenta corriente" y, por las dudas, la lista scrollea. */}
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="compras">Compras ({ordenes.length})</TabsTrigger>
          <TabsTrigger value="cuenta">
            Cuenta<span className="hidden sm:inline"> corriente</span> ({movimientos.length})
          </TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Datos bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Banco</p>
              <p className="font-medium">{proveedor.datosBancarios.banco || '—'}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">CBU</p>
                {proveedor.datosBancarios.cbu && (
                  <button
                    onClick={() => copiar(proveedor.datosBancarios.cbu, 'CBU')}
                    className="text-muted-foreground transition hover:text-foreground"
                    title="Copiar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="font-mono text-xs">
                {proveedor.datosBancarios.cbu
                  ? formatCBU(proveedor.datosBancarios.cbu)
                  : '—'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Alias</p>
                {proveedor.datosBancarios.alias && (
                  <button
                    onClick={() => copiar(proveedor.datosBancarios.alias, 'Alias')}
                    className="text-muted-foreground transition hover:text-foreground"
                    title="Copiar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="font-medium">{proveedor.datosBancarios.alias || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} value={proveedor.telefono} />
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} value={proveedor.email} />
            <div className="pt-1 text-xs text-muted-foreground">Referente</div>
            <p className="font-medium">{proveedor.contacto || '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Dirección
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              {proveedor.direccion.calle}, {proveedor.direccion.ciudad}
            </p>
            <p className="text-muted-foreground">
              {proveedor.direccion.provincia} · CP {proveedor.direccion.codigoPostal}
            </p>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="productos">
      <CatalogoProveedor
        items={catalogo}
        productos={productos}
        onAgregar={async (data) => {
          const producto = productos.find((p) => p.id === data.productoId);
          if (!producto) throw new Error('Producto no encontrado');
          const nuevo = await addItemCatalogo(empresaId, id, data, producto);
          setCatalogo((prev) =>
            [...prev, nuevo].sort((a, b) => a.productoNombre.localeCompare(b.productoNombre)),
          );
          toast.success(`${producto.nombre} agregado al catálogo`);
        }}
        onCrearProducto={async (data) => {
          // El producto nace acá, con la presentación en la que este
          // proveedor lo vende, y queda listado en su catálogo de una.
          const presentacionId = data.presentacionNombre ? `p${Date.now()}` : null;
          const producto = await addProducto(empresaId, {
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: '',
            tipo: 'venta',
            unidad: data.unidad,
            presentaciones: presentacionId
              ? [{ id: presentacionId, nombre: data.presentacionNombre, factor: data.factor }]
              : [],
            stockActual: 0,
            stockMinimo: 0,
            // El costo de la ficha es por unidad base, no por presentación.
            precioCompra: data.costoPresentacion / (data.factor || 1),
            precioVenta: 0,
            activo: true,
          });

          const nuevo = await addItemCatalogo(
            empresaId,
            id,
            {
              productoId: producto.id,
              presentacionId,
              costoPresentacion: data.costoPresentacion,
              codigoProveedor: data.codigoProveedor,
            },
            producto,
          );

          setProductos((prev) => [...prev, producto]);
          setCatalogo((prev) =>
            [...prev, nuevo].sort((a, b) => a.productoNombre.localeCompare(b.productoNombre)),
          );
          toast.success(`${producto.nombre} creado y agregado al catálogo`);
        }}
        onQuitar={async (itemId) => {
          try {
            await deleteItemCatalogo(empresaId, itemId);
            setCatalogo((prev) => prev.filter((x) => x.id !== itemId));
            toast.success('Producto quitado del catálogo');
          } catch {
            toast.error('No se pudo quitar el producto');
          }
        }}
      />

        </TabsContent>

        <TabsContent value="compras">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compras a este proveedor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Órdenes y recepciones. El detalle de la deuda está en Cuenta corriente.
              </p>
            </CardHeader>
            <CardContent>
              {ordenes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Todavía no le compraste nada a este proveedor.
                </p>
              ) : (
                <OrdenesTable ordenes={ordenes} ocultarProveedor />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuenta">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compras y pagos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Todo lo que movió el saldo. Filtrá por concepto para ver solo
                las compras o solo los pagos.
              </p>
            </CardHeader>
            <CardContent>
              <MovimientosTable movimientos={movimientos} tipoEntidad="proveedor" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span>{value || '—'}</span>
    </div>
  );
}
