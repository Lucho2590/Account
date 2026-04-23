'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Proveedor } from '@/types';
import { formatCUIT, formatCondicionIva } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Eye, Pencil, Trash2, Search, Plus } from 'lucide-react';

interface ProveedoresTableProps {
  proveedores: Proveedor[];
  onDelete: (id: string) => Promise<void>;
}

export function ProveedoresTable({ proveedores, onDelete }: ProveedoresTableProps) {
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; proveedor: Proveedor | null }>({
    open: false,
    proveedor: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProveedores = proveedores.filter(
    (proveedor) =>
      proveedor.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      proveedor.cuit.includes(search)
  );

  const handleDelete = async () => {
    if (!deleteDialog.proveedor) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteDialog.proveedor.id);
      setDeleteDialog({ open: false, proveedor: null });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/proveedores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      {filteredProveedores.length === 0 ? (
        <div className="rounded-md border bg-white py-8 text-center text-muted-foreground">
          {search ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Condición IVA</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell className="font-medium">{proveedor.razonSocial}</TableCell>
                    <TableCell>{formatCUIT(proveedor.cuit)}</TableCell>
                    <TableCell>{formatCondicionIva(proveedor.condicionIva)}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>{proveedor.datosBancarios.banco}</TableCell>
                    <TableCell>
                      <Badge variant={proveedor.activo ? 'default' : 'secondary'}>
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/proveedores/${proveedor.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/proveedores/${proveedor.id}/editar`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, proveedor })}
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
            {filteredProveedores.map((proveedor) => (
              <div
                key={proveedor.id}
                className="rounded-md border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{proveedor.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCUIT(proveedor.cuit)} · {formatCondicionIva(proveedor.condicionIva)}
                    </p>
                    {proveedor.telefono && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{proveedor.telefono}</p>
                    )}
                    {proveedor.datosBancarios.banco && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Banco: {proveedor.datosBancarios.banco}
                      </p>
                    )}
                  </div>
                  <Badge variant={proveedor.activo ? 'default' : 'secondary'} className="shrink-0">
                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/proveedores/${proveedor.id}`} aria-label="Ver">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/proveedores/${proveedor.id}/editar`} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteDialog({ open: true, proveedor })}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog({ open, proveedor: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{deleteDialog.proveedor?.razonSocial}</strong>? Esta acción no se puede
              deshacer y eliminará también su cuenta corriente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, proveedor: null })}
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
