import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { Calendar as CalendarIcon, UserPlus, ClipboardCheck, Search, Loader2, X, Check, ChevronsUpDown, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, Hash, CalendarClock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { consultasService, Consulta, AreaLaboratorio, Usuario } from '../../../features/consultas/services/consultasService';

const getEstadoBageColor = (estado: string) => {
  switch (estado) {
    case 'agendada': return 'bg-gray-500';
    case 'revision_previa': return 'bg-[#8B5CF6]';
    case 'revision_verificacion': return 'bg-[#003087]';
    case 'mejoras_solicitadas': return 'bg-[#F59E0B]';
    case 'ultima_revision': return 'bg-[#8B5CF6]';
    case 'finalizada': return 'bg-[#1D9E75]';
    case 'cancelada': return 'bg-gray-800';
    default: return 'bg-gray-500';
  }
};

const getFriendlyEstado = (estado: string) => {
  switch (estado) {
    case 'agendada': return 'Agendada';
    case 'revision_previa': return 'Revisión Previa';
    case 'revision_verificacion': return 'En Revisión (Checklist)';
    case 'mejoras_solicitadas': return 'En Mejoras';
    case 'ultima_revision': return 'Última Revisión';
    case 'finalizada': return 'Finalizada';
    case 'cancelada': return 'Cancelada';
    default: return estado;
  }
};

export function Solicitudes() {
  const { token } = useAuth();

  // Data State
  const [solicitudes, setSolicitudes] = useState<Consulta[]>([]);
  const [areas, setAreas] = useState<AreaLaboratorio[]>([]);
  const [consultores, setConsultores] = useState<Usuario[]>([]);

  // View State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultorSort, setConsultorSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [solicitudSort, setSolicitudSort] = useState<'none' | 'id' | 'fecha'>('none');

  // Form State
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [fechaPropuesta, setFechaPropuesta] = useState<string>('');
  const [selectedConsultores, setSelectedConsultores] = useState<Usuario[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  useEffect(() => {
    if (token) {
      Promise.all([
        consultasService.obtenerConsultas(token),
        consultasService.obtenerAreas(token),
        consultasService.obtenerConsultores(token)
      ]).then(([consultasData, areasData, consultoresData]) => {
        // Ordenadas de más nuevas a más viejas temporalmente
        const ordenadas = consultasData.sort((a, b) => b.id - a.id);
        setSolicitudes(ordenadas);
        setAreas(areasData);
        setConsultores(consultoresData);
        setLoading(false);
      }).catch(err => {
        console.error("Error cargando el panel de solicitudes:", err);
        setLoading(false);
      });
    }
  }, [token]);

  const consultoresDisponibles = consultores.filter(c => c.role === 'CONSULTOR' && c.is_active);

  const toggleConsultor = (consultor: Usuario) => {
    const exists = selectedConsultores.find(c => c.id === consultor.id);
    if (exists) {
      setSelectedConsultores(selectedConsultores.filter(c => c.id !== consultor.id));
    } else {
      setSelectedConsultores([...selectedConsultores, consultor]);
    }
  };

  const handleRemoveConsultor = (id: number) => {
    setSelectedConsultores(selectedConsultores.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !fechaPropuesta || selectedConsultores.length === 0) {
      toast.warning("Campos incompletos", {
        description: <span style={{ color: '#4b5563' }}>Por favor selecciona el área, la fecha y al menos un consultor.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
      return;
    }

    setSubmitting(true);
    try {
      let isoDate = null;
      if (fechaPropuesta) {
        // Enviamos la fecha con horario de mediodía para evitar desfase por timezone
        isoDate = `${fechaPropuesta}T12:00:00`;
      }

      const payload: Partial<Consulta> = {
        area_laboratorio: parseInt(selectedArea),
        fecha_finalizacion_propuesta: isoDate,
        responsables: selectedConsultores.map(c => c.id),
        estado: 'agendada'
      };

      const nueva = await consultasService.crearConsulta(token!, payload);

      // Actualizamos listado
      setSolicitudes([nueva, ...solicitudes]);
      toast.success("Solicitud agendada", {
        description: <span style={{ color: '#4b5563' }}>La auditoría ha sido programada con éxito.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });

      // Limpiamos formulario
      setSelectedArea('');
      setFechaPropuesta('');
      setSelectedConsultores([]);

    } catch (error) {
      toast.error("Error en servidor", {
        description: <span style={{ color: '#4b5563' }}>Hubo un problema al crear la solicitud. Verifica los datos.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleConsultorSort = () => {
    setConsultorSort(prev => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const toggleSolicitudSort = () => {
    setSolicitudSort(prev => {
      if (prev === 'none') return 'id';
      if (prev === 'id') return 'fecha';
      return 'none';
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta solicitud?")) {
      try {
        await consultasService.eliminarConsulta(token!, id);
        setSolicitudes(solicitudes.filter(s => s.id !== id));
        toast.success("Solicitud eliminada", {
          description: <span style={{ color: '#4b5563' }}>La solicitud ha sido eliminada correctamente.</span>,
          position: 'top-right',
          classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
        });
      } catch (error) {
        console.error("Error al eliminar la solicitud:", error);
        toast.error("Error", {
          description: <span style={{ color: '#4b5563' }}>Hubo un problema al eliminar la solicitud.</span>,
          position: 'top-right',
          classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
        });
      }
    }
  };

  const getConsultorName = (sol: Consulta) => {
    if (!sol.responsables || sol.responsables.length === 0) return '';
    const c = consultores.find(co => co.id === sol.responsables[0]);
    return c ? `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase() : '';
  };

  const filteredSolicitudes = solicitudes
    .filter(sol => {
      const term = searchTerm.toLowerCase();
      const areaName = (sol.area_nombre ? `${sol.area_nombre} #${sol.id}` : `Auditoría #${sol.id}`).toLowerCase();
      return areaName.includes(term);
    })
    .sort((a, b) => {
      // Solicitud sort takes priority if active
      if (solicitudSort === 'id') return a.id - b.id;
      if (solicitudSort === 'fecha') {
        const dateA = a.fecha_finalizacion_propuesta ? new Date(a.fecha_finalizacion_propuesta).getTime() : Infinity;
        const dateB = b.fecha_finalizacion_propuesta ? new Date(b.fecha_finalizacion_propuesta).getTime() : Infinity;
        return dateA - dateB;
      }
      // Otherwise use consultor sort
      if (consultorSort === 'none') return 0;
      const nameA = getConsultorName(a);
      const nameB = getConsultorName(b);
      return consultorSort === 'asc'
        ? nameA.localeCompare(nameB, 'es')
        : nameB.localeCompare(nameA, 'es');
    });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#003087] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div>
        <h1 className="text-[20px] font-medium text-gray-900">Gestión de Solicitudes</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Planificación y agendamiento de visitas de consultoría técnica.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulario de Registro (Columna Izquierda) */}
        <div className="xl:col-span-1">
          <Card className="p-6 border border-[#E8E8E8] sticky top-8 bg-white shadow-sm">
            <h2 className="text-[16px] font-bold text-[#003087] mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Nueva Solicitud
            </h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="lab">Laboratorio a auditar</Label>
                <Select onValueChange={setSelectedArea} value={selectedArea}>
                  <SelectTrigger id="lab">
                    <SelectValue placeholder="Seleccionar laboratorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id.toString()}>{area.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha propuesta de finalización</Label>
                <div className="relative">
                  <Input
                    id="fecha"
                    type="date"
                    className="pl-10"
                    value={fechaPropuesta}
                    onChange={(e) => setFechaPropuesta(e.target.value)}
                  />
                  <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asignar consultores</Label>
                <div className="space-y-2">
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between font-normal text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {selectedConsultores.length > 0
                          ? `${selectedConsultores.length} consultor(es) seleccionado(s)`
                          : "Seleccionar consultores..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] xl:w-[350px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nombre..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No se encontraron consultores.</CommandEmpty>
                          <CommandGroup>
                            {consultoresDisponibles.map((user) => {
                              const isSelected = selectedConsultores.some(c => c.id === user.id);
                              return (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.first_name} ${user.last_name} ${user.username}`}
                                  onSelect={() => toggleConsultor(user)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 text-[#003087] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"
                                      }`}
                                  />
                                  <span>
                                    {user.first_name || user.username} {user.last_name}
                                    <span className="text-gray-400 ml-1">(@{user.username})</span>
                                  </span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Lista de consultores seleccionados (visual) */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedConsultores.map(consultor => (
                      <Badge key={consultor.id} variant="secondary" className="bg-blue-50 text-[#003087] border-blue-100 flex items-center gap-1.5 py-1">
                        {consultor.first_name || consultor.username}
                        <button
                          type="button"
                          onClick={() => handleRemoveConsultor(consultor.id)}
                          className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#003087] hover:bg-[#002366] text-white py-6 shadow-md transition-all active:scale-[0.98]"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Agendar Visita"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Listado de Solicitudes Agendadas (Columna Derecha) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-semibold text-gray-900">Visitas Programadas</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={solicitudSort === 'none' ? 'outline' : 'default'}
                size="sm"
                onClick={toggleSolicitudSort}
                className={`h-9 text-[13px] gap-1.5 transition-all ${solicitudSort === 'none'
                  ? 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  : 'bg-[#003087] hover:bg-[#002366] text-white'
                  }`}
              >
                {solicitudSort === 'none' && <ArrowUpDown className="w-3.5 h-3.5" />}
                {solicitudSort === 'id' && <Hash className="w-3.5 h-3.5" />}
                {solicitudSort === 'fecha' && <CalendarClock className="w-3.5 h-3.5" />}
                {solicitudSort === 'none' ? 'Ordenar' : solicitudSort === 'id' ? 'Por ID' : 'Fecha próxima'}
              </Button>
              <Button
                variant={consultorSort === 'none' ? 'outline' : 'default'}
                size="sm"
                onClick={toggleConsultorSort}
                className={`h-9 text-[13px] gap-1.5 transition-all ${consultorSort === 'none'
                  ? 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  : 'bg-[#003087] hover:bg-[#002366] text-white'
                  }`}
              >
                {consultorSort === 'none' && <ArrowUpDown className="w-3.5 h-3.5" />}
                {consultorSort === 'asc' && <ArrowUpAZ className="w-3.5 h-3.5" />}
                {consultorSort === 'desc' && <ArrowDownAZ className="w-3.5 h-3.5" />}
                Consultor
              </Button>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Buscar por laboratorio..."
                  className="pl-9 h-9 text-[13px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSolicitudes.length === 0 ? (
              <div className="p-12 text-center text-gray-500 border border-dashed border-[#E8E8E8] rounded-xl bg-gray-50">
                No hay auditorías que coincidan con la búsqueda.
              </div>
            ) : filteredSolicitudes.map((sol) => {
              const respNames = sol.responsables.map(rId => {
                const c = consultores.find(co => co.id === rId);
                return c ? (c.first_name || c.username) : `Usuario #${rId}`;
              }).join(', ') || 'Sin asignar';

              // Mostrar fecha propuesta si existe, si no, fecha de creación
              const dateToShow = sol.fecha_finalizacion_propuesta
                ? new Date(sol.fecha_finalizacion_propuesta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : new Date(sol.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

              return (
                <Card key={sol.id} className="p-5 border border-[#E8E8E8] hover:shadow-sm transition-shadow bg-white">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#003087] uppercase tracking-wider">SOL-{sol.id.toString().padStart(3, '0')}</span>
                        <h3 className="text-[16px] font-bold text-gray-900 mt-0.5">{sol.area_nombre ? `${sol.area_nombre} #${sol.id}` : `Auditoría #${sol.id}`}</h3>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[13px] text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {dateToShow}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4 text-gray-400" />
                          {respNames}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Badge className={`${getEstadoBageColor(sol.estado)} text-white border-none shadow-none font-medium px-2 py-0.5 text-[11px]`}>
                        {getFriendlyEstado(sol.estado)}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" className="text-[13px] text-[#003087] h-8 px-3 hover:bg-blue-50">
                          Ver Detalles
                        </Button>
                        <Button variant="ghost" className="text-[13px] text-red-600 h-8 px-2 hover:bg-red-50" onClick={() => handleDelete(sol.id)} title="Eliminar solicitud">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Información adicional según requerimientos de seguridad */}
          <div className="mt-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <p className="text-[12px] text-blue-700 leading-relaxed">
              <strong>Nota normativa:</strong> Según la norma ISO 45001, todos los expedientes de visita deben almacenarse por un mínimo de 5 años. Asegúrese de adjuntar la documentación correspondiente al finalizar el ciclo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}