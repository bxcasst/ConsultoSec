import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { ArrowLeft, LayoutGrid, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { consultasService, Consulta, PropuestaMejora } from '../../../features/consultas/services/consultasService';
import { useAuth } from '../../../features/auth/AuthContext';

// Importación de componentes modulares
import { WorkspaceSwitcher } from '../../components/seguimiento/WorkspaceSwitcher';
import { TaskTable } from '../../components/seguimiento/TaskTable';
import { GanttChart } from '../../components/seguimiento/GanttChart';

export function Seguimiento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const idFromUrl = searchParams.get('id');
  const labFromUrl = searchParams.get('lab');

  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [propuestas, setPropuestas] = useState<PropuestaMejora[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tablero' | 'cronograma'>('tablero');
  const [isSiguienteModalOpen, setIsSiguienteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Administrador';

  const loadData = useCallback(async () => {
    if (token && idFromUrl) {
      try {
        const consultaId = parseInt(idFromUrl);
        const [consultaData, propuestasData] = await Promise.all([
          consultasService.obtenerConsulta(token, consultaId),
          consultasService.obtenerPropuestas(token, consultaId)
        ]);
        setConsulta(consultaData);
        setPropuestas(propuestasData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        toast.error('Error al cargar datos de seguimiento');
      } finally {
        setLoading(false);
      }
    }
  }, [token, idFromUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS CENTRALIZADOS ---
  const handleUpdate = async (id: number, data: Partial<PropuestaMejora>) => {
    if (!token || isAdmin) return;
    try {
      // Validación: fecha_inicio no puede ser mayor que fecha_fin
      const p = propuestas.find(x => x.id === id);
      if (p) {
        const newStart = data.fecha_inicio ?? p.fecha_inicio;
        const newEnd = data.fecha_fin ?? p.fecha_fin;
        if (newStart && newEnd && newStart > newEnd) {
          toast.error('Fecha inválida', {
            description: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
            position: 'top-right',
          });
          return;
        }
      }

      // Optimizamos: Calculamos la duración localmente para que la tabla se actualice en tiempo real
      let updatedData = { ...data };
      if (data.fecha_inicio || data.fecha_fin) {
        if (p) {
          const start = new Date(data.fecha_inicio || p.fecha_inicio || '');
          const end = new Date(data.fecha_fin || p.fecha_fin || '');
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            updatedData.duracion_dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }
      }

      await consultasService.actualizarPropuesta(token, id, data);
      setPropuestas(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));

      toast('Actualizado ✓', {
        position: 'bottom-right',
        duration: 1500,
        style: {
          fontSize: '12px',
          padding: '6px 12px',
          minHeight: 'auto',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          color: '#4B5563',
          borderRadius: '8px',
          width: 'auto',
          marginLeft: 'auto',
          marginTop: '6em'
        }
      });
    } catch {
      toast.error('Error al actualizar');
      loadData();
    }
  };

  const handleCreate = async (plazo: 'corto' | 'mediano' | 'largo') => {
    if (!token || !idFromUrl || isAdmin) return;
    const prefix = plazo === 'corto' ? '1' : plazo === 'mediano' ? '2' : '3';
    const existingInPlazo = propuestas.filter(p => p.plazo === plazo);

    try {
      await consultasService.crearPropuesta(token, {
        consulta: parseInt(idFromUrl),
        plazo,
        numero_tarea: `${prefix}.${existingInPlazo.length + 1}`,
        accion_correctiva: 'Nueva acción correctiva',
        fecha_inicio: new Date().toISOString().substring(0, 10),
        fecha_fin: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
        estado: 'en_proceso',
        aprobacion: 'pendiente',
        responsables: []
      });
      loadData();
      toast.success('Tarea agregada');
    } catch {
      toast.error('Error al crear tarea');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || isAdmin) return;
    try {
      await consultasService.eliminarPropuesta(token, id);
      setPropuestas(prev => prev.filter(p => p.id !== id));
      toast.success('Actividad eliminada');
    } catch {
      toast.error('Error al eliminar');
      loadData();
    }
  };

  const handleSiguienteFase = async () => {
    if (!token || !consulta) return;
    setIsSubmitting(true);
    try {
      await consultasService.actualizarConsulta(token, consulta.id, { estado: 'ultima_revision' });
      toast.success('Pasando a última verificación', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
      navigate('/consultor/auditorias');
    } catch (error) {
      console.error("Error al cambiar de fase", error);
      toast.error('Hubo un error al intentar cambiar de fase', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
    } finally {
      setIsSubmitting(false);
      setIsSiguienteModalOpen(false);
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003087]"></div>
      </div>
    );
  }

  if (!idFromUrl || !consulta) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-20 text-center">
        <Card className="p-12 border-dashed border-2 border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-[18px] font-bold text-gray-900">Auditoría no encontrada</h2>
          <p className="text-gray-500 text-[14px] mt-2 mb-8">No pudimos cargar los detalles de la auditoría.</p>
          <Button onClick={() => navigate(-1)} className="bg-[#003087]">Volver</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB] overflow-hidden">
      {/* Header Fijo */}
      <header className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 text-gray-400 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-gray-900">Seguimiento de Mejoras</h1>
              <Badge variant="outline" className="text-[11px] font-bold border-blue-200 text-[#003087] bg-blue-50">Auditoría #{idFromUrl}</Badge>
            </div>
            <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mt-0.5">
              <LayoutGrid size={12} className="text-gray-400" />
              {consulta.area_nombre || labFromUrl} · {propuestas.length} Actividades
            </p>
          </div>
        </div>

        <WorkspaceSwitcher viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      {/* Área de Trabajo */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {viewMode === 'tablero' ? (
          <div className="flex-1 overflow-y-auto p-2 md:p-4 pb-32 md:pb-32">
            <Card className="border-none shadow-sm overflow-hidden bg-white w-full">
              <TaskTable
                propuestas={propuestas}
                isAdmin={isAdmin}
                onUpdate={handleUpdate}
                onCreate={handleCreate}
                onDelete={handleDelete}
              />
            </Card>
          </div>
        ) : (
          <GanttChart
            propuestas={propuestas}
            isAdmin={isAdmin}
            onUpdate={(id, data) => handleUpdate(id, data)}
          />
        )}

        {/* Botones Flotantes */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 w-48 lg:w-56 z-50">
          <Button
            onClick={() => setIsSiguienteModalOpen(true)}
            className="bg-[#003087] hover:bg-[#002366] text-white shadow-xl px-8 py-7 rounded-2xl gap-3 font-bold transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
            Siguiente Etapa
          </Button>
        </div>
      </main>

      <Dialog open={isSiguienteModalOpen} onOpenChange={setIsSiguienteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirmar Siguiente Etapa</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas pasar a la etapa de última verificación?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsSiguienteModalOpen(false)}
              disabled={isSubmitting}
            >
              Regresar
            </Button>
            <Button
              className="bg-[#003087] hover:bg-[#002266] text-white"
              onClick={handleSiguienteFase}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cargando...' : 'Sí, continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
