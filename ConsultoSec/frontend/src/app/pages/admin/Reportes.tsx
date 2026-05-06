import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { consultasService, Consulta, AreaLaboratorio } from '../../../features/consultas/services/consultasService';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const Reportes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [areas, setAreas] = useState<AreaLaboratorio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      consultasService.obtenerConsultas(token),
      consultasService.obtenerAreas(token)
    ]).then(([consultasData, areasData]) => {
      setConsultas(consultasData);
      setAreas(areasData);
    }).catch(err => {
      console.error("Error al cargar reportes:", err);
      toast.error("Error al cargar la lista de reportes");
    }).finally(() => {
      setLoading(false);
    });
  }, [token]);

  const handleDownloadPDF = async (id: number, areaNombre: string) => {
    if (!token) return;
    
    const loadingToast = toast.loading(`Generando PDF para ${areaNombre}...`);
    try {
      const blob = await consultasService.descargarPDF(token, id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Auditoria_${areaNombre.replace(/\s+/g, '_')}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss(loadingToast);
      toast.success("PDF descargado correctamente");
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("El reporte solo está disponible para auditorías finalizadas.");
    }
  };

  const filteredConsultas = consultas.filter(c => {
    const matchesSearch = (c.area_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || c.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'finalizada': 
        return <Badge className="bg-[#1D9E75] text-white">Finalizada</Badge>;
      case 'revision_verificacion': 
        return <Badge className="bg-[#003087] text-white">En curso</Badge>;
      case 'mejoras_solicitadas': 
        return <Badge className="bg-[#F59E0B] text-white">En Mejoras</Badge>;
      case 'cancelada': 
        return <Badge className="bg-gray-800 text-white">Cancelada</Badge>;
      default: 
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">{estado}</Badge>;
    }
  };

  const kpis = [
    { label: 'Total Auditorías', value: consultas.length, icon: ClipboardList, color: '#003087' },
    { label: 'Completadas', value: consultas.filter(c => c.estado === 'finalizada').length, icon: CheckCircle2, color: '#1D9E75' },
    { label: 'En Proceso', value: consultas.filter(c => c.estado !== 'finalizada' && c.estado !== 'cancelada').length, icon: Clock, color: '#8B5CF6' },
    { label: 'Pendientes', value: consultas.filter(c => c.estado === 'pendiente' || c.estado === 'agendada').length, icon: AlertTriangle, color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full bg-[#F5F5F5] min-h-screen animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="text-gray-500 mt-1">Genera y descarga reportes detallados de las auditorías realizadas.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-6 border border-[#E8E8E8] bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${kpi.color}10` }}>
                  <Icon size={24} style={{ color: kpi.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border border-[#E8E8E8] bg-white overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E8E8E8] bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por laboratorio o ID..."
              className="w-full pl-10 pr-4 py-2 border border-[#E8E8E8] rounded-lg outline-none focus:ring-2 focus:ring-[#003087]/20 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-gray-400" size={18} />
            <select 
              className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003087]/20 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="finalizada">Finalizada</option>
              <option value="revision_verificacion">En curso</option>
              <option value="mejoras_solicitadas">En Mejoras</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[12px] uppercase tracking-wider font-semibold text-gray-500 border-b border-[#E8E8E8]">
                <th className="px-6 py-4">ID / Auditoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Responsables</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {filteredConsultas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron auditorías con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredConsultas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#003087]">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.area_nombre || 'Sin nombre'}</p>
                          <p className="text-xs text-gray-500">ID: #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getEstadoBadge(c.estado)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(c.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 truncate max-w-[150px]">
                        {c.responsables.length > 0 ? `${c.responsables.length} consultores` : 'Sin asignar'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm"
                        className="bg-[#003087] hover:bg-blue-800 text-white gap-2 text-xs"
                        onClick={() => handleDownloadPDF(c.id, c.area_nombre || 'Auditoria')}
                      >
                        <Download size={14} />
                        Reporte PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
