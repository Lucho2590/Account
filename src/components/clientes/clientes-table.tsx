'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cliente } from '@/types';
import { formatCUIT, formatCondicionIva, formatCurrency } from '@/lib/formatters';
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

interface ClientesTableProps {
  clientes: Cliente[];
  onDelete: (id: string) => Promise<void>;
}

export function ClientesTable({ clientes, onDelete }: ClientesTableProps) {
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cliente: Cliente | null }>({
    open: false,
    cliente: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cuit.includes(search)
  );

  const handleDelete = async () => {
    if (!deleteDialog.cliente) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteDialog.cliente.id);
      setDeleteDialog({ open: false, cliente: null });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Condición IVA</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Límite Crédito</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.razonSocial}</TableCell>
                  <TableCell>{formatCUIT(cliente.cuit)}</TableCell>
                  <TableCell>{formatCondicionIva(cliente.condicionIva)}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(cliente.limiteCredito)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/clientes/${cliente.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/clientes/${cliente.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, cliente })}
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
      </div>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog({ open, cliente: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{deleteDialog.cliente?.razonSocial}</strong>? Esta acción no se puede
              deshacer y eliminará también su cuenta corriente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, cliente: null })}
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
