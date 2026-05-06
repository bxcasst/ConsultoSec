import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Save,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  ClipboardCheck,
  PauseCircle,
  Plus,
  Trash2,
  LayoutGrid,
  PlusCircle,
  Edit3,
  HelpCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { consultasService, Consulta, ChecklistItem } from '../../../features/consultas/services/consultasService';
import { useAuth } from '../../../features/auth/AuthContext';

export function Checklist() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const labFromUrl = searchParams.get('lab');
  const idFromUrl = searchParams.get('id');

  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [preguntasDinamicas, setPreguntasDinamicas] = useState<any[]>([]);
  const [ultimoIdAgregado, setUltimoIdAgregado] = useState('');
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (token && idFromUrl) {
      consultasService.obtenerConsulta(token, parseInt(idFromUrl))
        .then(data => {
          setConsulta(data);
          setLoading(false);
          // If status is agendada or revision_previa, mark it internally as revision_verificacion indicating we started the checklist
          if (data.estado === 'agendada' || data.estado === 'revision_previa') {
            consultasService.actualizarConsulta(token, data.id, { estado: 'revision_verificacion' });
          }
        })
        .catch(err => {
          console.error("Error al cargar la consulta:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, idFromUrl]);

  // Filtrado de items (incluyendo preguntas dinámicas)
  const itemsFiltrados = [
    ...(consulta?.items_checklist || []),
    ...preguntasDinamicas
  ].filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const texto = item.requisito || item.pregunta || '';
    const norma = item.normativa_aplicable || '';
    const cat = item.categoria || '';
    
    return (
      texto.toLowerCase().includes(term) ||
      norma.toLowerCase().includes(term) ||
      cat.toLowerCase().includes(term)
    );
  });

  // Agrupación por categoría (usando los items filtrados)
  const secciones = itemsFiltrados.reduce((acc: any[], curr) => {
    const existing = acc.find(c => c.categoria === curr.categoria);
    if (existing) {
      existing.preguntas.push(curr);
    } else {
      acc.push({ categoria: curr.categoria, preguntas: [curr] });
    }
    return acc;
  }, []);

  const handleRespuesta = (item: ChecklistItem, valor: 'si' | 'no' | 'parcial' | 'no_evaluado') => {
    if (!consulta || !token) return;

    // Optimistic update
    const updatedItems = consulta.items_checklist.map(i =>
      i.id === item.id ? { ...i, cumple: valor } : i
    );
    setConsulta({ ...consulta, items_checklist: updatedItems });

    // API update
    consultasService.actualizarChecklistItem(token, item.id, { cumple: valor })
      .then(() => {
        toast('Actualizado ✓', {
          position: 'top-right',
          duration: 1500,
          style: { fontSize: '12px', padding: '6px 12px', minHeight: 'auto', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#4B5563', borderRadius: '8px', width: 'auto', marginLeft: 'auto', marginTop: '6em' }
        });
      })
      .catch(err => console.error("Error updating item", err));
  };

  const handleNota = (item: ChecklistItem, observacion: string) => {
    if (!consulta || !token) return;

    // Optimistic update
    const updatedItems = consulta.items_checklist.map(i =>
      i.id === item.id ? { ...i, observacion } : i
    );
    setConsulta({ ...consulta, items_checklist: updatedItems });

    // Debounce API update para notas
    if (debounceTimers.current[item.id]) {
      clearTimeout(debounceTimers.current[item.id]);
    }

    debounceTimers.current[item.id] = setTimeout(() => {
      consultasService.actualizarChecklistItem(token, item.id, { observacion })
        .then(() => {
          toast('Nota insertada ✓', {
            position: 'top-right',
            duration: 1500,
            style: { fontSize: '12px', padding: '6px 12px', minHeight: 'auto', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#4B5563', borderRadius: '8px', width: 'auto', marginLeft: 'auto', marginTop: '6em' }
          });
        })
        .catch(err => console.error("Error updating nota", err));
    }, 1000);
  };

  const handleFinalizar = async () => {
    if (!token || !consulta) return;
    setIsFinishing(true);
    try {
      await consultasService.actualizarConsulta(token, consulta.id, { estado: 'mejoras_solicitadas' });
      toast.success('Auditoría finalizada con éxito', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
      navigate('/consultor/auditorias');
    } catch (error) {
      console.error("Error al finalizar la auditoría", error);
      toast.error('Hubo un error al intentar finalizar la auditoría', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
    } finally {
      setIsFinishing(false);
      setIsFinalizarModalOpen(false);
    }
  };

  const handleGuardarProgreso = async () => {
    if (!token || !consulta) return;
    setIsSavingInProgress(true);

    try {
      // Force sync all checklist items before navigating away to avoid aborted requests
      await Promise.all(
        consulta.items_checklist.map(item =>
          consultasService.actualizarChecklistItem(token, item.id, {
            cumple: item.cumple,
            observacion: item.observacion
          })
        )
      );
      toast.success('Progreso de la auditoría guardado', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
      navigate('/consultor/auditorias');
    } catch (error) {
      console.error("Error al guardar el progreso", error);
      toast.error('Error al guardar el progreso', { position: 'top-right', duration: 3000, style: { marginTop: '6em' } });
    } finally {
      setIsSavingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
      </div>
    );
  }

  if (!labFromUrl || !idFromUrl || !consulta) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-20 text-center">
        <Card className="p-12 border-dashed border-2 border-gray-200 bg-white">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-[20px] font-bold text-gray-900">Acceso Restringido o No Encontrado</h2>
          <p className="text-[15px] text-gray-500 mt-2 mb-8">
            Debes seleccionar una auditoría válida y asignada desde tu panel para cargar el checklist.
          </p>
          <Button onClick={() => navigate('/consultor/auditorias')} className="bg-[#003087] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Mis Auditorías
          </Button>
        </Card>
      </div>
    );
  }

  const addNuevaPregunta = (categoriaEspecifica?: string) => {
    const nuevoId = `custom_${Date.now()}`;
    const nueva = {
      id: nuevoId,
      categoria: categoriaEspecifica || nuevaCatNombre || 'Adicional',
      pregunta: '',
      esNueva: true
    };
    setPreguntasDinamicas([...preguntasDinamicas, nueva]);
    setUltimoIdAgregado(nuevoId);
  };

  const updateTextoPregunta = (id: string, texto: string) => {
    setPreguntasDinamicas(prev => prev.map(q => q.id === id ? { ...q, pregunta: texto } : q));
  };

  // NUEVA FUNCIÓN: Permite cambiar el nombre de una sección completa
  const updateNombreSeccion = (viejoNombre: string, nuevoNombre: string) => {
    setPreguntasDinamicas(prev => prev.map(q => 
      q.categoria === viejoNombre ? { ...q, categoria: nuevoNombre } : q
    ));
  };

  const eliminarPregunta = (id: string) => {
    setPreguntasDinamicas(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header informativo renovado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-[#E8E8E8] shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#003087]" />
            </div>
            <h1 className="text-[22px] font-bold text-gray-900">Checklist de Auditoría</h1>
          </div>
          <p className="text-[14px] text-gray-500 mt-2">
            Laboratorio: <strong className="text-gray-900">{consulta.area_nombre || labFromUrl}</strong>
            <span className="mx-3 text-gray-300">|</span>
            Folio: <strong className="text-[#003087]">{idFromUrl}</strong>
          </p>
        </div>

        {/* Buscador Integrado */}
        <div className="w-full lg:w-80 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <LayoutGrid className="w-4 h-4 text-gray-400 group-focus-within:text-[#003087] transition-colors" />
          </div>
          <Input 
            placeholder="Buscar por pregunta o categoría..."
            className="pl-10 h-11 border-[#E8E8E8] bg-gray-50/50 focus:bg-white transition-all rounded-xl text-[14px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-10 pb-24">
        {secciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg bg-white">
            No hay requisitos configurados para este checklist.
            Comunícate con el administrador.
          </div>
        ) : (
          secciones.map((seccion, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-[16px] font-bold text-[#003087] border-b border-[#E8E8E8] pb-2 uppercase tracking-wide">
                {seccion.categoria || 'General'}
              </h2>

              <div className="grid gap-6">
                {seccion.preguntas.map((q: ChecklistItem) => (
                  <Card key={q.id} className="p-6 border border-[#E8E8E8] bg-white">
                    <div className="space-y-6">
                      {/* Pregunta y Botones */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        {(q as any).requisito ? (
                          <>
                            <p className="text-[15px] text-gray-800 font-medium flex-1 pt-1">
                              {q.requisito}
                              {q.normativa_aplicable && (
                                <span className="block mt-1 text-[12px] text-gray-500 font-normal">
                                  Ref: {q.normativa_aplicable}
                                </span>
                              )}
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                  onClick={() => handleRespuesta(q, 'si')}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${q.cumple === 'si' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" /> CUMPLE
                                </button>
                                <button
                                  onClick={() => handleRespuesta(q, 'parcial')}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${q.cumple === 'parcial' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  <AlertCircle className="w-4 h-4" /> PARCIAL
                                </button>
                                <button
                                  onClick={() => handleRespuesta(q, 'no')}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${q.cumple === 'no' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  <XCircle className="w-4 h-4" /> NO CUMPLE
                                </button>
                                <button
                                  title="No Evaluado"
                                  onClick={() => handleRespuesta(q, 'no_evaluado')}
                                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${q.cumple === 'no_evaluado' ? 'bg-gray-200 text-gray-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </button>
                              </div>

                              <Button variant="outline" size="sm" className="h-10 border-[#E8E8E8] gap-2">
                                <Camera className="w-4 h-4 text-gray-400" />
                                Foto
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-[15px] text-gray-800 font-medium flex-1 pt-1">{(q as any).pregunta}</p>
                        )}
                      </div>

                      {/* Sección de Notas */}
                      <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 space-y-2">
                        <Label className="text-[12px] flex items-center gap-2 text-gray-600">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Observaciones y notas técnicas
                        </Label>
                        <Textarea
                          placeholder="Escribe aquí los detalles del hallazgo..."
                          className="bg-white border-[#E8E8E8] text-[13px] resize-none w-full break-all"
                          rows={2}
                          value={q.observacion || ''}
                          maxLength={128}
                          onChange={(e) => handleNota(q, e.target.value)}
                        />
                        <div className="flex justify-end">
                          <span className={`text-[10px] font-medium ${(q.observacion || '').length >= 120 ? 'text-red-500' : 'text-gray-400'}`}>
                            {(q.observacion || '').length}/128
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
          ))
        )}

        {/* Panel Inferior */}
        <div className="pt-6">
          <Card className="p-8 border-2 border-dashed border-gray-200 bg-gray-50/20 flex flex-col items-center space-y-5">
            <div className="text-center">
              <h3 className="text-[#003087] font-bold text-[16px]">¿Nueva categoría?</h3>
              <p className="text-gray-400 text-[12px]">Crea una nueva sección personalizada</p>
            </div>
            <div className="flex w-full max-w-lg gap-3 bg-white p-2 rounded-xl border border-gray-200">
              <Input 
                placeholder="Nombre de sección..."
                value={nuevaCatNombre}
                onChange={(e) => setNuevaCatNombre(e.target.value)}
                className="border-none focus-visible:ring-0 text-[14px]"
              />
              <Button onClick={() => addNuevaPregunta()} className="bg-[#003087] text-white hover:bg-[#002366] gap-2 px-6 h-10">
                <Plus className="w-4 h-4" /> Crear
              </Button>
            </div>
          </Card>
        </div>

        {/* Botones Flotantes */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 w-48 lg:w-56">
          <Button
            onClick={handleGuardarProgreso}
            disabled={isSavingInProgress}
            className="bg-white border border-[#E8E8E8] text-gray-700 hover:bg-gray-50 hover:text-[#003087] shadow-xl px-8 py-7 rounded-2xl gap-3 font-bold transition-all active:scale-95"
          >
            {isSavingInProgress ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-[#003087] rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5 text-gray-500" />
            )}
            Guardar Progreso
          </Button>

          <Button
            onClick={() => setIsFinalizarModalOpen(true)}
            className="bg-[#003087] hover:bg-[#002366] text-white shadow-xl px-8 py-7 rounded-2xl gap-3 font-bold transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
            Finalizar Auditoría
          </Button>
        </div>  
      </div>

      <Dialog open={isFinalizarModalOpen} onOpenChange={setIsFinalizarModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirmar Finalización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas dar por concluida esta auditoría?
              Se notificará al sistema y el checklist pasará a la etapa de resolución de mejoras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsFinalizarModalOpen(false)}
              disabled={isFinishing}
            >
              Regresar
            </Button>
            <Button
              className="bg-[#003087] hover:bg-[#002266] text-white"
              onClick={handleFinalizar}
              disabled={isFinishing}
            >
              {isFinishing ? 'Cargando...' : 'Sí, finalizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}