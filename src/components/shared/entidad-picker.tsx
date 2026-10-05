'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatCUIT } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/**
 * Lo mínimo que el picker necesita. Cliente y Proveedor lo cumplen por igual,
 * así que la misma pantalla sirve para los dos lados del negocio.
 */
export interface EntidadSeleccionable {
  id: string;
  razonSocial: string;
  cuit: string;
  activo: boolean;
}

interface EntidadPickerProps {
  entidades: EntidadSeleccionable[];
  value: string | null;
  onChange: (entidadId: string) => void;
  placeholder?: string;
  tituloDialog?: string;
  icon?: typeof User;
}

export function EntidadPicker({
  entidades,
  value,
  onChange,
  placeholder = 'Seleccioná un cliente…',
  tituloDialog = 'Seleccionar cliente',
  icon: Icon = User,
}: EntidadPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = entidades.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entidades
      .filter((c) => c.activo)
      .filter((c) => {
        if (!q) return true;
        return (
          c.razonSocial.toLowerCase().includes(q) ||
          c.cuit.toLowerCase().includes(q)
        );
      });
  }, [entidades, search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selected.razonSocial}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{tituloDialog}</DialogTitle>
        </DialogHeader>
        <div className="px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por razón social o CUIT…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              No hay entidades que coincidan
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((c) => {
                const isSelected = c.id === value;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c.id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent',
                        isSelected && 'bg-accent',
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.razonSocial}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          CUIT: {formatCUIT(c.cuit)}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
