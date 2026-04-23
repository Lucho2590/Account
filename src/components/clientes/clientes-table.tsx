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
          <Link href="/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {filteredClientes.length === 0 ? (
        <div className="rounded-md border bg-white py-8 text-center text-muted-foreground">
          {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
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
                  <TableHead className="text-right">Límite Crédito</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
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
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {filteredClientes.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-md border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{cliente.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCUIT(cliente.cuit)} · {formatCondicionIva(cliente.condicionIva)}
                    </p>
                    {cliente.telefono && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{cliente.telefono}</p>
                    )}
                  </div>
                  <Badge variant={cliente.activo ? 'default' : 'secondary'} className="shrink-0">
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Límite: {formatCurrency(cliente.limiteCredito)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/clientes/${cliente.id}`} aria-label="Ver">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/clientes/${cliente.id}/editar`} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteDialog({ open: true, cliente })}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
