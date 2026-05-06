import { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { DatePicker } from '../ui/date-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Clock,
  CheckCircle2,
  Construction,
  Package,
} from 'lucide-react';
import { PropuestaMejora } from '../../../features/consultas/services/consultasService';

// --- OPCIONES FIJAS ---
export const RESPONSABLES_OPTIONS = [
  { id: 'prestadores_servicio', label: 'Prestadores del servicio social' },
  { id: 'personal_area', label: 'Personal del área' },
  { id: 'laboratorio', label: 'Laboratorio' },
  { id: 'encargado', label: 'Encargado' },
  { id: 'compras', label: 'Compras' },
];

const S_OPTIONS = [
  { id: 'clasificar', label: 'Clasificar', bg: 'bg-indigo-50', color: 'text-indigo-600' },
  { id: 'ordenar', label: 'Ordenar', bg: 'bg-blue-50', color: 'text-blue-600' },
  { id: 'limpiar', label: 'Limpiar', bg: 'bg-emerald-50', color: 'text-emerald-600' },
  { id: 'estandarizar', label: 'Estandarizar', bg: 'bg-amber-50', color: 'text-amber-600' },
  { id: 'disciplina', label: 'Disciplina', bg: 'bg-rose-50', color: 'text-rose-600' },
];

const ESTADO_OPTIONS = [
  { id: 'completado', label: 'Completado', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { id: 'en_proceso', label: 'En proceso', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: 'requiere_adquisicion', label: 'Requiere adquisición', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { id: 'requiere_instalacion', label: 'Requiere instalación', icon: Construction, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
];

const APROBACION_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
  { id: 'aprobado', label: 'Aprobado', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'rechazado', label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' },
];

const formatDateForInput = (dateStr: string | null): string => {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
};

interface TaskTableProps {
  propuestas: PropuestaMejora[];
  isAdmin: boolean;
  onUpdate: (id: number, data: Partial<PropuestaMejora>) => void;
  onCreate: (plazo: 'corto' | 'mediano' | 'largo') => void;
  onDelete: (id: number) => void;
}

export function TaskTable({ propuestas, isAdmin, onUpdate, onCreate, onDelete }: TaskTableProps) {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <TableSection
        title="1. Corto Plazo"
        plazo="corto"
        tasks={propuestas.filter(p => p.plazo === 'corto')}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
        onCreate={onCreate}
        onDelete={onDelete}
      />
      <TableSection
        title="2. Mediano Plazo"
        plazo="mediano"
        tasks={propuestas.filter(p => p.plazo === 'mediano')}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
        onCreate={onCreate}
        onDelete={onDelete}
      />
      <TableSection
        title="3. Largo Plazo"
        plazo="largo"
        tasks={propuestas.filter(p => p.plazo === 'largo')}
        isAdmin={isAdmin}
        onUpdate={onUpdate}
        onCreate={onCreate}
        onDelete={onDelete}
      />
    </div>
  );
}

// --- SUB-COMPONENTE DE SECCIÓN ---
function TableSection({
  title,
  plazo,
  tasks,
  isAdmin,
  onUpdate,
  onCreate,
  onDelete
}: {
  title: string,
  plazo: 'corto' | 'mediano' | 'largo',
  tasks: PropuestaMejora[],
  isAdmin: boolean,
  onUpdate: (id: number, data: Partial<PropuestaMejora>) => void,
  onCreate: (plazo: 'corto' | 'mediano' | 'largo') => void,
  onDelete: (id: number) => void
}) {
  const accentColor = plazo === 'corto' ? '#003087' : plazo === 'mediano' ? '#f59e0b' : '#10b981';

  return (
    <div className="mb-10 last:mb-0">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b-2 mb-4" style={{ borderLeft: `4px solid ${accentColor}` }}>
        <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
        {!isAdmin && (
          <Button onClick={() => onCreate(plazo)} size="sm" variant="ghost" className="h-8 text-[#003087] hover:bg-blue-50 text-[12px] font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Agregar Actividad
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="text-gray-700 font-bold bg-gray-50/50">
              <th className="px-4 py-3 text-left w-14">ID</th>
              <th className="px-4 py-3 text-left min-w-[200px]">Acción Correctiva</th>
              <th className="px-4 py-3 text-left w-48">Responsable(s)</th>
              <th className="px-4 py-3 text-left w-36">Inicio</th>
              <th className="px-4 py-3 text-left w-36">Fin</th>
              <th className="px-4 py-3 text-center w-16">Días</th>
              <th className="px-4 py-3 text-left w-36">5S</th>
              <th className="px-4 py-3 text-left w-44">Estado</th>
              <th className="px-4 py-3 text-center w-28">Aprobación</th>
              {!isAdmin && <th className="px-4 py-3 w-10 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-4 py-4 font-black text-[#003087]">{p.numero_tarea}</td>

                <td className="px-4 py-3">
                  <DebouncedInput
                    value={p.accion_correctiva}
                    disabled={isAdmin}
                    onUpdate={(val) => onUpdate(p.id, { accion_correctiva: val })}
                    className="h-9 text-[12px] border-transparent hover:border-gray-200 focus:border-[#003087] bg-transparent focus:bg-white transition-all text-gray-700 font-medium"
                  />
                </td>

                <td className="px-4 py-3">
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-1">
                      {p.responsables?.map(r => (
                        <Badge key={r} variant="secondary" className="text-[10px] bg-gray-100 font-normal">
                          {RESPONSABLES_OPTIONS.find(o => o.id === r)?.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <ResponsableSelector p={p} onUpdate={onUpdate} />
                  )}
                </td>

                <td className="px-4 py-3">
                  <DatePicker
                    value={p.fecha_inicio}
                    disabled={isAdmin}
                    onChange={(val) => onUpdate(p.id, { fecha_inicio: val })}
                    maxDate={p.fecha_fin || undefined}
                    className="w-full shadow-sm"
                  />
                </td>

                <td className="px-4 py-3">
                  <DatePicker
                    value={p.fecha_fin}
                    disabled={isAdmin}
                    onChange={(val) => onUpdate(p.id, { fecha_fin: val })}
                    minDate={p.fecha_inicio || undefined}
                    className="w-full shadow-sm"
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 font-bold text-gray-600">{p.duracion_dias}</span>
                </td>

                <td className="px-4 py-3">
                  <GenericSelector
                    value={p.s_implementada}
                    options={S_OPTIONS}
                    disabled={isAdmin}
                    onSelect={(val) => onUpdate(p.id, { s_implementada: val })}
                    placeholder="Seleccionar 5S"
                  />
                </td>

                <td className="px-4 py-3">
                  <GenericSelector
                    value={p.estado}
                    options={ESTADO_OPTIONS}
                    disabled={isAdmin}
                    onSelect={(val) => onUpdate(p.id, { estado: val })}
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  <GenericSelector
                    value={p.aprobacion}
                    options={APROBACION_OPTIONS}
                    disabled={isAdmin}
                    onSelect={(val) => onUpdate(p.id, { aprobacion: val as any })}
                    className=""
                  />
                </td>

                {!isAdmin && (
                  <td className="px-4 py-3 text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[16px] font-bold">¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="text-[13px] text-gray-500">
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la actividad
                            "<strong>{p.accion_correctiva || 'Nueva acción'}</strong>" del sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-[12px]">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold"
                          >
                            Eliminar Actividad
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- INPUT CON DEBOUNCE PARA EVITAR SOBRECARGA ---
function DebouncedInput({
  value,
  onUpdate,
  disabled,
  className,
  type = "text"
}: {
  value: string,
  onUpdate: (val: string) => void,
  disabled?: boolean,
  className?: string,
  type?: string
}) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar si el valor externo cambia (ej. desde el Gantt)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    // Debounce de 1 segundo
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (val !== value) {
        onUpdate(val);
      }
    }, 1000);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (localValue !== value) {
      onUpdate(localValue);
    }
  };

  return (
    <Input
      type={type}
      value={localValue}
      disabled={disabled}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

// --- COMPONENTE SELECTOR GENÉRICO (COMBOBOX) ---
function GenericSelector({
  value,
  options,
  onSelect,
  disabled,
  placeholder = "Seleccionar...",
  className = ""
}: {
  value: string,
  options: any[],
  onSelect: (val: string) => void,
  disabled?: boolean,
  placeholder?: string,
  className?: string
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={`h-9 justify-between text-[11px] font-semibold w-full border-gray-100 bg-white transition-all hover:border-gray-300 ${selected?.color || 'text-gray-400'} ${selected?.bg || ''} ${selected?.border ? `border-2 ${selected.border}` : ''} ${className}`}
        >
          <div className="flex items-center truncate gap-2">
            {selected?.icon && <selected.icon className="w-3.5 h-3.5" />}
            <span className="truncate">{selected ? selected.label : placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1 shadow-xl border-gray-100" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  onSelect={() => { onSelect(opt.id); setOpen(false); }}
                  className={`text-[11px] py-2.5 px-3 cursor-pointer rounded-md mb-1 last:mb-0 transition-colors ${value === opt.id ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full ${opt.bg || 'bg-gray-300'} ${opt.color?.replace('text-', 'bg-') || ''}`} />
                    <div className="flex items-center gap-2 flex-1">
                      {opt.icon && <opt.icon className={`w-3.5 h-3.5 ${opt.color}`} />}
                      <span className={`font-bold ${opt.color || 'text-gray-700'}`}>{opt.label}</span>
                    </div>
                    {value === opt.id && <Check className="h-3.5 w-3.5 text-[#003087]" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ResponsableSelector({ p, onUpdate }: { p: PropuestaMejora, onUpdate: (id: number, data: Partial<PropuestaMejora>) => void }) {
  const [open, setOpen] = useState(false);
  const toggleResponsable = (id: string) => {
    const current = p.responsables || [];
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    onUpdate(p.id, { responsables: next });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-start text-[11px] font-medium w-full border-gray-100 bg-white hover:bg-gray-50 transition-colors">
          {p.responsables?.length > 1
            ? <Badge className="bg-[#003087] text-white text-[9px] hover:bg-[#003087] h-5 px-1.5">{p.responsables.length} responsables</Badge>
            : p.responsables?.length === 1
              ? <Badge className="bg-[#003087] text-white text-[9px] hover:bg-[#003087] h-5 px-1.5 truncate max-w-[130px]">
                {RESPONSABLES_OPTIONS.find(o => o.id === p.responsables[0])?.label}
              </Badge>
              : <span className="text-gray-400">Seleccionar...</span>}
          <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-1 shadow-xl border-gray-100" align="start">
        <Command>
          <CommandInput placeholder="Buscar responsable..." className="h-9 text-[12px] border-none focus:ring-0" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-4 text-[11px] text-gray-500 text-center">No hay resultados.</CommandEmpty>
            <CommandGroup>
              {RESPONSABLES_OPTIONS.map((opt) => (
                <CommandItem key={opt.id} onSelect={() => toggleResponsable(opt.id)} className="text-[11px] py-2.5 px-3 cursor-pointer rounded-md mb-1 last:mb-0 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`flex items-center justify-center w-4 h-4 rounded border ${p.responsables?.includes(opt.id) ? 'bg-[#003087] border-[#003087]' : 'border-gray-300'}`}>
                      {p.responsables?.includes(opt.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`flex-1 ${p.responsables?.includes(opt.id) ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{opt.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
