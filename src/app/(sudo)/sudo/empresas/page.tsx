'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Empresa } from '@/types';
import {
  getEmpresas,
  addEmpresa,
  setEmpresaActiva,
  addUsuario,
  getCuentasCorrientes,
  getUsuarios,
} from '@/lib/firebase-db';
import { EmpresaForm, type AltaEmpresaData } from '@/components/empresas/empresa-form';
import { KpiCard } from '@/components/shared/kpi-card';
import { formatCurrency } from '@/lib/formatters';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RUTA_SUPER_INICIO } from '@/components/layout/nav-items';
import {
  Loader2,
  Plus,
  Search,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Eye,
  Power,
  LogIn,
} from 'lucide-react';

type EmpresaConTotales = Empresa & {
  totalCobrar: number;
  totalPagar: number;
  usuarios: number;
};

export default function EmpresasPage() {
  const { impersonar } = useAuth();
  const router = useRouter();
  const [empresas, setEmpresas] = useState<EmpresaConTotales[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const base = await getEmpresas();
        const usuarios = await getUsuarios();

        // Una lectura de cuentas por empresa. Con pocas empresas es lo más
        // simple; si algún día son cientos, conviene un agregado por empresa
        // mantenido al escribir, en vez de recalcularlo acá.
        const conTotales = await Promise.all(
          base.map(async (e) => {
            const cuentas = await getCuentasCorrientes(e.id).catch(() => []);
            let totalCobrar = 0;
            let totalPagar = 0;
            for (const c of cuentas) {
              if (c.saldoActual <= 0) continue;
              if (c.tipoEntidad === 'cliente') totalCobrar += c.saldoActual;
              else totalPagar += c.saldoActual;
            }
            return {
              ...e,
              totalCobrar,
              totalPagar,
              usuarios: usuarios.filter((u) => u.empresaId === e.id).length,
            };
          }),
        );

        if (!cancelado) setEmpresas(conTotales);
      } catch (error) {
        console.error('Error loading empresas:', error);
        if (!cancelado) toast.error('Error al cargar las empresas');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  async function handleCreate(data: AltaEmpresaData) {
    // Los errores se propagan a propósito: el diálogo los muestra en línea.
    const empresa = await addEmpresa({ nombre: data.nombre, cuit: data.cuit });

    await addUsuario({
      nombre: data.duenoNombre,
      email: data.duenoEmail,
      password: data.duenoPassword,
      rol: 'dueno',
      empresaId: empresa.id,
    });

    setEmpresas((prev) =>
      [...prev, { ...empresa, totalCobrar: 0, totalPagar: 0, usuarios: 1 }].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    );
    toast.success(`Empresa ${empresa.nombre} creada con su usuario dueño`);
  }

  async function handleToggleActiva(empresa: EmpresaConTotales) {
    const activa = !empresa.activa;
    try {
      await setEmpresaActiva(empresa.id, activa);
      setEmpresas((prev) => prev.map((e) => (e.id === empresa.id ? { ...e, activa } : e)));
      toast.success(activa ? 'Empresa activada' : 'Empresa desactivada');
    } catch (error) {
      console.error('Error updating empresa:', error);
      toast.error('Error al actualizar la empresa');
    }
  }

  function entrarAlPanel(empresa: EmpresaConTotales) {
    impersonar(empresa.id);
    router.push('/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtradas = empresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) || e.cuit.includes(search),
  );

  const totalCobrar = empresas.reduce((acc, e) => acc + e.totalCobrar, 0);
  const totalPagar = empresas.reduce((acc, e) => acc + e.totalPagar, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Supervisión
          </p>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">
            Todas las empresas de la plataforma y el estado de sus cuentas.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Empresas" value={empresas.length} icon={Building2} />
        <KpiCard
          label="Total a cobrar"
          value={formatCurrency(totalCobrar)}
          sub="Sumado de todas las empresas"
          tone="positive"
          icon={ArrowDownCircle}
        />
        <KpiCard
          label="Total a pagar"
          value={formatCurrency(totalPagar)}
          sub="Sumado de todas las empresas"
          tone="negative"
          icon={ArrowUpCircle}
        />
        <KpiCard
          label="Balance neto"
          value={formatCurrency(totalCobrar - totalPagar)}
          tone={totalCobrar - totalPagar >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Listado de empresas</CardTitle>
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtradas.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search ? 'No se encontraron empresas' : 'Todavía no hay empresas cargadas'}
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead className="text-right">Usuarios</TableHead>
                      <TableHead className="text-right">A cobrar</TableHead>
                      <TableHead className="text-right">A pagar</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtradas.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nombre}</TableCell>
                        <TableCell>{e.cuit}</TableCell>
                        <TableCell className="text-right">{e.usuarios}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {formatCurrency(e.totalCobrar)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {formatCurrency(e.totalPagar)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.activa ? 'default' : 'secondary'}>
                            {e.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => entrarAlPanel(e)}
                              title="Entrar al panel de esta empresa"
                            >
                              <LogIn className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`${RUTA_SUPER_INICIO}/${e.id}`} aria-label="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActiva(e)}
                              title={e.activa ? 'Desactivar' : 'Activar'}
                            >
                              <Power className={e.activa ? 'h-4 w-4 text-destructive' : 'h-4 w-4'} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 md:hidden">
                {filtradas.map((e) => (
                  <div key={e.id} className="rounded-md border bg-card p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.cuit} · {e.usuarios} usuario{e.usuarios === 1 ? '' : 's'}
                        </p>
                      </div>
                      <Badge variant={e.activa ? 'default' : 'secondary'} className="shrink-0">
                        {e.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs">
                        <span className="text-emerald-600">{formatCurrency(e.totalCobrar)}</span>
                        {' · '}
                        <span className="text-rose-600">{formatCurrency(e.totalPagar)}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => entrarAlPanel(e)}
                          aria-label="Entrar al panel"
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`${RUTA_SUPER_INICIO}/${e.id}`} aria-label="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActiva(e)}
                          aria-label={e.activa ? 'Desactivar' : 'Activar'}
                        >
                          <Power className={e.activa ? 'h-4 w-4 text-destructive' : 'h-4 w-4'} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EmpresaForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
