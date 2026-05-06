import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  File as FileIcon,
  Image,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { consultasService, Training, Consulta, AreaLaboratorio, Usuario, CapacitacionArchivo } from '../../../features/consultas/services/consultasService';
import { Badge } from '../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { Button } from '../../components/ui/button';

// --- SUB-COMPONENTE: Modal de Descarga ---
const ModalDescarga = ({ training, onClose }: { training: Training | null, onClose: () => void }) => {
  if (!training) return null;
  const materiales = training.archivos?.filter(a => a.tipo === 'material') || [];
  const evidencias = training.archivos?.filter(a => a.tipo === 'evidencia') || [];
  const todos = training.archivos || [];

  const descargarTodos = () => {
    todos.forEach((arch, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = arch.archivo;
        link.download = arch.nombre || arch.archivo.split('/').pop() || `archivo-${i}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 300);
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-[480px] bg-white rounded-xl shadow-2xl">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">Archivos adjuntos</h3>
            <p className="text-xs text-gray-500">{training.tema}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="mx-auto mb-2" size={36} />
              <p className="text-sm">Esta capacitación no tiene archivos adjuntos.</p>
            </div>
          ) : (
            <>
              {materiales.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Materiales ({materiales.length})</p>
                  <div className="space-y-2">
                    {materiales.map(arch => (
                      <a
                        key={arch.id}
                        href={arch.archivo}
                        download={arch.nombre}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                            <FileIcon size={15} className="text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-blue-700">{arch.nombre || arch.archivo.split('/').pop()}</span>
                        </div>
                        <Upload size={14} className="text-gray-400 group-hover:text-blue-500 rotate-180" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {evidencias.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evidencias ({evidencias.length})</p>
                  <div className="space-y-2">
                    {evidencias.map(arch => (
                      <a
                        key={arch.id}
                        href={arch.archivo}
                        download={arch.nombre}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <Image size={15} className="text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-green-700">{arch.nombre || arch.archivo.split('/').pop()}</span>
                        </div>
                        <Upload size={14} className="text-gray-400 group-hover:text-green-500 rotate-180" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {todos.length > 1 && (
          <div className="p-4 border-t bg-gray-50 rounded-b-xl">
            <button
              onClick={descargarTodos}
              className="w-full py-2 bg-[#003087] text-white rounded-md text-sm font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={15} className="rotate-180" /> Descargar todos ({todos.length} archivos)
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// --- SUB-COMPONENTE: Tarjeta de Capacitación ---
const TrainingCard = ({
  training,
  onEdit,
  areas,
  consultas,
  usuarios,
  userRole
}: {
  training: Training,
  onEdit: (t: Training) => void,
  areas: AreaLaboratorio[],
  consultas: Consulta[],
  usuarios: Usuario[],
  userRole?: string
}) => {
  const [showDescarga, setShowDescarga] = useState(false);

  // Helpers para mostrar nombres
  const labNames = training.laboratorios.map(id => areas.find(a => a.id === id)?.nombre || `Lab #${id}`).join(', ');
  const audNames = training.consultas.map(id => {
    const c = consultas.find(c => c.id === id);
    return c && c.area_nombre ? `${c.area_nombre} #${id}` : `AUD #${id}`;
  }).join(', ');
  const totalArchivos = training.archivos?.length || 0;

  return (
    <>
      <div className="bg-white border border-[#E8E8E8] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-left">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900">{training.tema}</h3>
          <div className="flex items-center gap-2">
            {training.consultas.length > 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                {training.consultas.length} Auditorías
              </span>
            )}
            {totalArchivos > 0 && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">
                {totalArchivos} archivo{totalArchivos > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{training.descripcion}</p>

        <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {training.fecha}</div>
          <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {labNames || 'Sin laboratorio asignado'}</div>
          <div className="flex items-center gap-2"><Users size={16} className="text-gray-400" /> {training.asistentes.length} asistentes</div>
        </div>

        {audNames && (
          <div className="text-xs text-gray-500 mb-4">
            <span className="font-semibold">Auditorías relacionadas:</span> {audNames}
          </div>
        )}

        <div className="flex gap-3 border-t border-gray-50 pt-4">
          <button
            onClick={() => onEdit(training)}
            className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Editar / Ver detalles
          </button>
          <button
            onClick={() => setShowDescarga(true)}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Upload size={14} className="rotate-180" />
            Descargar materiales{totalArchivos > 0 ? ` (${totalArchivos})` : ''}
          </button>
        </div>
      </div>

      {showDescarga && <ModalDescarga training={training} onClose={() => setShowDescarga(false)} />}
    </>
  );
};

// --- SUB-COMPONENTE: Drawer de Registro ---
const AddTrainingDrawer = ({
  isOpen,
  onClose,
  onSave,
  editingTraining,
  areas,
  consultas,
  usuarios
}: {
  isOpen: boolean,
  onClose: () => void,
  onSave: (t: Partial<Training>) => void,
  editingTraining: Training | null,
  areas: AreaLaboratorio[],
  consultas: Consulta[],
  usuarios: Usuario[]
}) => {

  // Estados del formulario
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [selectedLabs, setSelectedLabs] = useState<number[]>([]);
  const [selectedAuditorias, setSelectedAuditorias] = useState<number[]>([]);
  const [selectedAsistentes, setSelectedAsistentes] = useState<number[]>([]);
  const [responsable, setResponsable] = useState('');

  // Estados de archivos
  const [materialesNuevos, setMaterialesNuevos] = useState<File[]>([]);
  const [evidenciasNuevas, setEvidenciasNuevas] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<CapacitacionArchivo[]>([]);
  const [archivosAEliminar, setArchivosAEliminar] = useState<number[]>([]);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const evidenciaInputRef = useRef<HTMLInputElement>(null);

  // Estados de popovers
  const [openLabs, setOpenLabs] = useState(false);
  const [openAudits, setOpenAudits] = useState(false);
  const [openAsistentes, setOpenAsistentes] = useState(false);

  // Efecto para cargar datos si estamos editando
  useEffect(() => {
    if (editingTraining) {
      setTema(editingTraining.tema);
      setDescripcion(editingTraining.descripcion);
      setFecha(editingTraining.fecha);
      setSelectedLabs(editingTraining.laboratorios || []);
      setSelectedAuditorias(editingTraining.consultas || []);
      setSelectedAsistentes(editingTraining.asistentes || []);
      setResponsable(editingTraining.responsable || '');
      setArchivosExistentes(editingTraining.archivos || []);
      setArchivosAEliminar([]);
      setMaterialesNuevos([]);
      setEvidenciasNuevas([]);
    } else {
      setTema('');
      setDescripcion('');
      setFecha(new Date().toISOString().split('T')[0]);
      setSelectedLabs([]);
      setSelectedAuditorias([]);
      setSelectedAsistentes([]);
      setResponsable('');
      setArchivosExistentes([]);
      setArchivosAEliminar([]);
      setMaterialesNuevos([]);
      setEvidenciasNuevas([]);
    }
  }, [editingTraining, isOpen]);

  const toggleSelection = (id: number, list: number[], setList: React.Dispatch<React.SetStateAction<number[]>>) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleGuardar = () => {
    // Validar campos obligatorios
    const missingFields = [];
    if (!tema.trim()) missingFields.push("Título/Tema");
    if (!descripcion.trim()) missingFields.push("Descripción");
    if (!fecha) missingFields.push("Fecha");
    if (!responsable.trim()) missingFields.push("Responsable");
    if (selectedLabs.length === 0) missingFields.push("Laboratorios");

    if (missingFields.length > 0) {
      return toast.warning("Campos obligatorios faltantes", {
        description: `Por favor completa: ${missingFields.join(", ")}`,
        position: 'top-right'
      });
    }

    onSave({
      ...(editingTraining && { id: editingTraining.id }),
      tema,
      descripcion,
      fecha,
      responsable,
      laboratorios: selectedLabs,
      consultas: selectedAuditorias,
      asistentes: selectedAsistentes,
      _materialesNuevos: materialesNuevos,
      _evidenciasNuevas: evidenciasNuevas,
      _archivosAEliminar: archivosAEliminar,
    } as any);
  };

  const consultoresDisponibles = usuarios.filter(u => u.role === 'CONSULTOR' && u.is_active);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl z-[70] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out flex flex-col text-left`}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{editingTraining ? 'Editar' : 'Registrar'} Capacitación</h2>
            <p className="text-xs text-gray-500">Completa la información detallada abajo.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-5">
          {/* Título y Descripción */}
          <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Título / Tema</label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej. Uso de equipo de protección"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Descripción / Objetivo</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe brevemente de qué trata la sesión..."
                className="w-full p-2 border border-gray-300 rounded-md h-20 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block">Responsable (Instructor)</label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del instructor"
              />
            </div>
          </div>

          {/* Selector de Laboratorios */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Laboratorios a los que aplica</label>
            <Popover open={openLabs} onOpenChange={setOpenLabs}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openLabs} className="w-full justify-between font-normal">
                  {selectedLabs.length > 0 ? `${selectedLabs.length} laboratorio(s) seleccionado(s)` : "Seleccionar laboratorios..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" style={{ zIndex: 80 }}>
                <Command>
                  <CommandInput placeholder="Buscar laboratorio..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No se encontraron laboratorios.</CommandEmpty>
                    <CommandGroup>
                      {areas.map((area) => (
                        <CommandItem key={area.id} value={area.nombre} onSelect={() => toggleSelection(area.id, selectedLabs, setSelectedLabs)}>
                          <Check className={`mr-2 h-4 w-4 text-[#003087] transition-opacity ${selectedLabs.includes(area.id) ? "opacity-100" : "opacity-0"}`} />
                          {area.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedLabs.map(id => {
                const lab = areas.find(a => a.id === id);
                return lab ? (
                  <Badge key={id} variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    {lab.nombre}
                    <button onClick={() => toggleSelection(id, selectedLabs, setSelectedLabs)} className="ml-1 hover:text-red-500"><X size={12} /></button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Selector de Auditorías (Consultas) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Auditorías relacionadas</label>
            <Popover open={openAudits} onOpenChange={setOpenAudits}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openAudits} className="w-full justify-between font-normal">
                  {selectedAuditorias.length > 0 ? `${selectedAuditorias.length} auditoría(s) seleccionada(s)` : "Seleccionar auditorías..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" style={{ zIndex: 80 }}>
                <Command>
                  <CommandInput placeholder="Buscar auditoría (#ID o Laboratorio)..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No se encontraron auditorías.</CommandEmpty>
                    <CommandGroup>
                      {consultas.map((c) => (
                        <CommandItem key={c.id} value={`${c.id} ${c.area_nombre || ''}`} onSelect={() => toggleSelection(c.id, selectedAuditorias, setSelectedAuditorias)}>
                          <Check className={`mr-2 h-4 w-4 text-[#003087] transition-opacity ${selectedAuditorias.includes(c.id) ? "opacity-100" : "opacity-0"}`} />
                          Auditoría #{c.id} - {c.area_nombre || 'General'}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAuditorias.map(id => {
                const aud = consultas.find(a => a.id === id);
                return aud ? (
                  <Badge key={id} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    AUD #{id} ({aud.area_nombre || 'N/A'})
                    <button onClick={() => toggleSelection(id, selectedAuditorias, setSelectedAuditorias)} className="ml-1 hover:text-red-500"><X size={12} /></button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Selector de Asistentes (Consultores) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block border-b pb-1">Consultores Asistentes ({selectedAsistentes.length})</label>
            <Popover open={openAsistentes} onOpenChange={setOpenAsistentes}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openAsistentes} className="w-full justify-between font-normal text-left">
                  <span className="flex items-center gap-2 text-[#003087] font-medium"><Plus size={16} /> Agregar asistentes (Consultores)</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" style={{ zIndex: 80 }}>
                <Command>
                  <CommandInput placeholder="Buscar consultor por nombre o username..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No se encontraron consultores.</CommandEmpty>
                    <CommandGroup>
                      {usuarios.map((user) => (
                        <CommandItem key={user.id} value={`${user.first_name} ${user.last_name} ${user.username}`} onSelect={() => toggleSelection(user.id, selectedAsistentes, setSelectedAsistentes)}>
                          <Check className={`mr-2 h-4 w-4 text-[#003087] transition-opacity ${selectedAsistentes.includes(user.id) ? "opacity-100" : "opacity-0"}`} />
                          {user.first_name || user.username} {user.last_name} (@{user.username})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex flex-col gap-2 mt-2">
              {selectedAsistentes.map(id => {
                const u = usuarios.find(u => u.id === id);
                if (!u) return null;
                return (
                  <div key={id} className="flex justify-between items-center p-2 border border-gray-200 rounded-md bg-gray-50 text-sm">
                    <span>{u.first_name || u.username} {u.last_name} <span className="text-gray-400">(@{u.username})</span></span>
                    <button onClick={() => toggleSelection(id, selectedAsistentes, setSelectedAsistentes)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Archivos: Materiales y Evidencias */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 block border-b pb-1">Archivos adjuntos</label>

            {/* Archivos ya guardados en el servidor */}
            {archivosExistentes.filter(a => !archivosAEliminar.includes(a.id)).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Archivos existentes</p>
                {archivosExistentes
                  .filter(a => !archivosAEliminar.includes(a.id))
                  .map(arch => (
                    <div key={arch.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        {arch.tipo === 'material'
                          ? <FileIcon size={14} className="text-blue-500" />
                          : <Image size={14} className="text-green-500" />}
                        <a href={arch.archivo} target="_blank" rel="noreferrer" className="hover:underline text-[#003087]">
                          {arch.nombre || arch.archivo.split('/').pop()}
                        </a>
                        <span className="text-[10px] text-gray-400 uppercase">{arch.tipo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setArchivosAEliminar([...archivosAEliminar, arch.id])}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Materiales */}
              <div>
                <input
                  ref={materialInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  className="hidden"
                  onChange={(e) => { if (e.target.files) setMaterialesNuevos([...materialesNuevos, ...Array.from(e.target.files)]); }}
                />
                <button
                  type="button"
                  onClick={() => materialInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <Upload className="mx-auto text-gray-400 group-hover:text-blue-400 mb-1" size={20} />
                  <p className="text-[10px] text-gray-600 font-medium">Materiales PDF/PPT</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Haz clic para seleccionar</p>
                </button>
                {materialesNuevos.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {materialesNuevos.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-blue-50 rounded px-2 py-1">
                        <span className="truncate text-blue-700">{f.name}</span>
                        <button type="button" onClick={() => setMaterialesNuevos(materialesNuevos.filter((_, idx) => idx !== i))} className="ml-1 text-red-400 hover:text-red-600"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidencias */}
              <div>
                <input
                  ref={evidenciaInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files) setEvidenciasNuevas([...evidenciasNuevas, ...Array.from(e.target.files)]); }}
                />
                <button
                  type="button"
                  onClick={() => evidenciaInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50 hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <Upload className="mx-auto text-gray-400 group-hover:text-green-400 mb-1" size={20} />
                  <p className="text-[10px] text-gray-600 font-medium">Fotos Evidencia</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Imágenes (JPG, PNG...)</p>
                </button>
                {evidenciasNuevas.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {evidenciasNuevas.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-green-50 rounded px-2 py-1">
                        <span className="truncate text-green-700">{f.name}</span>
                        <button type="button" onClick={() => setEvidenciasNuevas(evidenciasNuevas.filter((_, idx) => idx !== i))} className="ml-1 text-red-400 hover:text-red-600"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-md font-bold text-gray-700 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 py-2.5 bg-[#003087] text-white rounded-md font-bold hover:bg-blue-800 shadow-lg"
          >
            {editingTraining ? 'Actualizar Cambios' : 'Guardar Capacitación'}
          </button>
        </div>
      </div>
    </>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const CapacitacionesAdmin = () => {
  const { token, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [areas, setAreas] = useState<AreaLaboratorio[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Esperar a que la autenticación termine antes de intentar cargar datos
    if (authLoading) return;

    // Si no hay token (no autenticado), salir del estado de loading inmediatamente
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      consultasService.obtenerCapacitaciones(token),
      consultasService.obtenerAreas(token),
      consultasService.obtenerConsultas(token),
      consultasService.obtenerConsultores(token)
    ]).then(([caps, areasData, consultasData, usersData]) => {
      setTrainings(caps);
      setAreas(areasData);
      setConsultas(consultasData);
      setUsuarios(usersData);
    }).catch(err => {
      console.error("Error al cargar datos:", err);
      toast.error(`Error de carga: ${err.message || String(err)}`);
    }).finally(() => {
      setLoading(false);
    });
  }, [token, authLoading]);


  const handleSaveTraining = async (newTraining: any) => {
    if (!token) return;

    // Extraer datos de archivos del payload (no se envían al endpoint JSON)
    const materialesNuevos: File[] = newTraining._materialesNuevos || [];
    const evidenciasNuevas: File[] = newTraining._evidenciasNuevas || [];
    const archivosAEliminar: number[] = newTraining._archivosAEliminar || [];

    // Limpiar campos privados antes de enviar
    const payload: Partial<Training> = {
      tema: newTraining.tema,
      descripcion: newTraining.descripcion,
      fecha: newTraining.fecha,
      responsable: newTraining.responsable,
      laboratorios: newTraining.laboratorios,
      consultas: newTraining.consultas,
      asistentes: newTraining.asistentes,
    };

    try {
      // 1. Cerrar drawer ANTES de cualquier operación asíncrona extra
      //    para evitar re-renders del drawer mientras se suben archivos
      const isNew = !newTraining.id;

      let savedId: number;

      if (!isNew) {
        const updated = await consultasService.actualizarCapacitacion(token, newTraining.id, payload);
        savedId = updated.id;
      } else {
        const created = await consultasService.crearCapacitacion(token, payload);
        savedId = created.id;
      }

      // 2. Cerrar drawer inmediatamente tras guardar los datos principales
      setIsDrawerOpen(false);
      setEditingTraining(null);

      // 3. Operaciones de archivos (drawer ya cerrado, sin riesgo de crash)
      await Promise.all(archivosAEliminar.map(id => consultasService.eliminarArchivoCapacitacion(token, id)));
      await Promise.all(materialesNuevos.map(f => consultasService.subirArchivoCapacitacion(token, savedId, f, 'material')));
      await Promise.all(evidenciasNuevas.map(f => consultasService.subirArchivoCapacitacion(token, savedId, f, 'evidencia')));

      // 4. Un solo reload al final para actualizar la lista con archivos incluidos
      const refreshed = await consultasService.obtenerCapacitaciones(token);
      setTrainings(refreshed);

      toast.success(isNew ? "Capacitación registrada correctamente" : "Capacitación actualizada correctamente");
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Hubo un error al guardar la capacitación";

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const details = Object.entries(data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
            .join(" | ");
          if (details) errorMessage += `: ${details}`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage, {
        position: 'top-right',
        duration: 5000
      });
    }
  };

  const handleOpenEdit = (training: Training) => {
    setEditingTraining(training);
    setIsDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTraining(null);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full bg-[#F5F5F5] min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-800">Capacitaciones registradas</h2>
          <p className="text-gray-500 text-sm">Registro dinámico de sesiones vinculadas a las auditorías y laboratorios.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-[#003087] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md flex items-center gap-2 shadow-md font-semibold"
        >
          <Plus size={20} /> Nueva capacitación
        </button>
      </header>

      {/* Barra de búsqueda */}
      <div className="max-w-5xl mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por título o nombre de consultor asistente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-400 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/30 focus:border-[#003087] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl space-y-5">
        {(() => {
          const filtered = trainings.filter(t => {
            const term = searchTerm.toLowerCase();
            if (!term) return true;
            // Buscar por título
            if (t.tema.toLowerCase().includes(term)) return true;
            // Buscar por nombre de asistentes
            return t.asistentes.some(asId => {
              const u = usuarios.find(u => u.id === asId);
              if (!u) return false;
              const fullName = `${u.first_name || ''} ${u.last_name || ''} ${u.username}`.toLowerCase();
              return fullName.includes(term);
            });
          });

          if (filtered.length === 0) return (
            <div className="bg-white p-20 rounded-xl border-2 border-dashed border-gray-200 text-center">
              <ClipboardCheck className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">
                {searchTerm ? 'No se encontraron capacitaciones con esa búsqueda.' : 'No hay capacitaciones registradas todavía.'}
              </p>
            </div>
          );

          return filtered.map((t) => (
            <TrainingCard
              key={t.id}
              training={t}
              onEdit={handleOpenEdit}
              areas={areas}
              consultas={consultas}
              usuarios={usuarios}
              userRole={user?.role}
            />
          ));
        })()}
      </div>

      <AddTrainingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveTraining}
        editingTraining={editingTraining}
        areas={areas}
        consultas={consultas}
        usuarios={usuarios}
      />
    </div>


  );
};
