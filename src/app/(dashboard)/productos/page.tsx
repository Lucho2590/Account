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

  const renderTable = (items: Producto[]) => (
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
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No hay productos en esta categoría
            </TableCell>
          </TableRow>
        ) : (
          items.map((producto) => (
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
              <TableCell className="text-right">{formatCurrency(producto.precioCompra)}</TableCell>
              <TableCell className="text-right">{formatCurrency(producto.precioVenta)}</TableCell>
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
          ))
        )}
      </TableBody>
    </Table>
  );

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

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="venta">
        <TabsList>
          <TabsTrigger value="venta">
            Productos de Venta ({productosVenta.length})
          </TabsTrigger>
          <TabsTrigger value="materia_prima">
            Materia Prima ({materiaPrima.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="venta">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Venta</CardTitle>
              <CardDescription>Productos destinados a la venta directa</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(productosVenta)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="materia_prima">
          <Card>
            <CardHeader>
              <CardTitle>Materia Prima</CardTitle>
              <CardDescription>Insumos y materiales de producción</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(materiaPrima)}</CardContent>
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
