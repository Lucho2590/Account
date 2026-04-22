'use client';

import { useMemo, useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { Producto } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ProductoPickerProps {
  productos: Producto[];
  onSelect: (producto: Producto) => void;
  excludeIds?: string[];
}

export function ProductoPicker({ productos, onSelect, excludeIds = [] }: ProductoPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productos
      .filter((p) => p.activo)
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [productos, search, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por nombre o código..."
          className="pl-9"
        />
      </div>

      {search && (
        <div className="max-h-72 overflow-y-auto rounded-md border bg-card">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-1 p-6 text-center text-sm text-muted-foreground">
              <Package className="h-6 w-6 opacity-40" />
              <span>No hay productos que coincidan</span>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => {
                const lowStock = p.stockActual <= p.stockMinimo;
                const sinStock = p.stockActual <= 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(p);
                        setSearch('');
                      }}
                      disabled={sinStock}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        sinStock
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent',
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{p.nombre}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            #{p.codigo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {formatCurrency(p.precioVenta)} / {p.unidad}
                          </span>
                          <span>·</span>
                          <Badge
                            variant={sinStock ? 'destructive' : lowStock ? 'secondary' : 'outline'}
                            className="h-5 px-1.5 text-[10px]"
                          >
                            Stock: {p.stockActual} {p.unidad}
                          </Badge>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
