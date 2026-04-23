'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Producto, Proveedor } from '@/types';
import { getProductos, getProveedores, deleteProducto } from '@/lib/firebase-db';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Search, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; producto: Producto | null }>({
    open: false,
    producto: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productosData, proveedoresData] = await Promise.all([
        getProductos(),
        getProveedores(),
      ]);
      setProductos(productosData);
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.producto) return;

    setIsDeleting(true);
    try {
      await deleteProducto(deleteDialog.producto.id);
      setProductos(productos.filter((p) => p.id !== deleteDialog.producto!.id));
      toast.success('Producto eliminado correctamente');
      setDeleteDialog({ open: false, producto: null });
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  const getProveedorNombre = (proveedorId?: string) => {
    if (!proveedorId) return '-';
    const proveedor = proveedores.find((p) => p.id === proveedorId);
    return proveedor?.razonSocial || '-';
  };

  const filteredProductos = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(search.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const productosVenta = filteredProductos.filter((p) => p.tipo === 'venta');
  const materiaPrima = filteredProductos.filter((p) => p.tipo === 'materia_prima');

  const renderProductos = (items: Producto[]) => {
    if (items.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No hay productos en esta categoría
        </div>
      );
    }
    return (
      <>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Precio Compra</TableHead>
                <TableHead className="text-right">Precio Venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-mono">{producto.codigo}</TableCell>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>{getProveedorNombre(producto.proveedorId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {producto.stockActual <= producto.stockMinimo && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span
                        className={
                          producto.stockActual <= producto.stockMinimo
                            ? 'text-orange-600 font-medium'
                            : ''
                        }
                      >
                        {producto.stockActual} {producto.unidad}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(producto.precioCompra)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(producto.precioVenta)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={producto.activo ? 'default' : 'secondary'}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/productos/${producto.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, producto })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 md:hidden">
          {items.map((producto) => {
            const stockBajo = producto.stockActual <= producto.stockMinimo;
            return (
              <div key={producto.id} className="rounded-md border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {producto.codigo}
                      </span>
                      <Badge
                        variant={producto.activo ? 'default' : 'secondary'}
                        className="h-5 text-[10px]"
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold">{producto.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getProveedorNombre(producto.proveedorId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link
                        href={`/productos/${producto.id}/editar`}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteDialog({ open: true, producto })}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span
                    className={
                      stockBajo
                        ? 'inline-flex items-center gap-1 font-medium text-orange-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {stockBajo && <AlertTriangle className="h-3.5 w-3.5" />}
                    Stock: {producto.stockActual} {producto.unidad}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    Compra {formatCurrency(producto.precioCompra)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    Venta {formatCurrency(producto.precioVenta)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

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
        <h1 className="text-3xl font-bold">Productos</h1>
        <p className="text-muted-foreground">Gestiona el inventario de productos y materias primas</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="venta">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="venta" className="flex-1 sm:flex-initial">
            Productos de Venta ({productosVenta.length})
          </TabsTrigger>
          <TabsTrigger value="materia_prima" className="flex-1 sm:flex-initial">
            Materia Prima ({materiaPrima.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="venta">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Venta</CardTitle>
              <CardDescription>Productos destinados a la venta directa</CardDescription>
            </CardHeader>
            <CardContent>{renderProductos(productosVenta)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="materia_prima">
          <Card>
            <CardHeader>
              <CardTitle>Materia Prima</CardTitle>
              <CardDescription>Insumos y materiales de producción</CardDescription>
            </CardHeader>
            <CardContent>{renderProductos(materiaPrima)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog({ open, producto: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{' '}
              <strong>{deleteDialog.producto?.nombre}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, producto: null })}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
