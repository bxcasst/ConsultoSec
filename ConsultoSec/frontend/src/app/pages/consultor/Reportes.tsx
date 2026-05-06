import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { consultasService, Consulta } from '../../../features/consultas/services/consultasService';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const ReportesConsultor = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    consultasService.obtenerConsultas(token)
      .then(data => {
        // El backend ya filtra por consultor si el token es de consultor.
        // Pero el usuario pidió específicamente los que estén FINALIZADOS.
        setConsultas(data.filter(c => c.estado === 'finalizada'));
      })
      .catch(err => {
        console.error("Error al cargar reportes:", err);
        toast.error("Error al cargar la lista de reportes");
      })
      .finally(() => {
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
      toast.error("Error al generar el PDF. Contacta al administrador.");
    }
  };

  const filteredConsultas = consultas.filter(c => {
    const matchesSearch = (c.area_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.id.toString().includes(searchTerm);
    return matchesSearch;
  });

  const stats = [
    { label: 'Tus Reportes Finalizados', value: consultas.length, icon: CheckCircle2, color: '#1D9E75' },
    { label: 'Total Auditorías Asignadas', value: '...', icon: ClipboardList, color: '#003087' }, // Podríamos cargar todas para este dato
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full bg-[#F5F5F5] min-h-screen animate-in fade-in duration-500 text-left">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reportes Finalizados</h1>
          <p className="text-gray-500 mt-1">Consulta y descarga los resultados finales de tus auditorías concluidas.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por laboratorio o ID..."
            className="w-full pl-10 pr-4 py-2 border border-[#E8E8E8] rounded-xl outline-none focus:ring-2 focus:ring-[#003087]/20 transition-all text-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {consultas.length === 0 ? (
        <Card className="p-20 border-2 border-dashed border-gray-200 bg-white text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No hay reportes finalizados</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">
            Aquí aparecerán las auditorías una vez que hayan pasado todas las etapas y sean marcadas como finalizadas.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredConsultas.map((c) => (
            <Card key={c.id} className="p-0 border border-[#E8E8E8] bg-white overflow-hidden hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row items-stretch md:items-center p-6 gap-6">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#1D9E75] shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{c.area_nombre || 'Sin nombre'}</h3>
                    <Badge className="bg-[#1D9E75] text-white text-[10px] uppercase font-bold border-none">Finalizada</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium"><span className="text-gray-400">ID:</span> #{c.id}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {new Date(c.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:border-l md:pl-6 border-[#E8E8E8]">
                  <Button 
                    variant="outline"
                    className="border-[#E8E8E8] text-gray-700 hover:bg-gray-50 gap-2 h-11 px-6 rounded-xl font-bold transition-all active:scale-95"
                    onClick={() => handleDownloadPDF(c.id, c.area_nombre || 'Auditoria')}
                  >
                    <Download size={18} className="text-gray-400" />
                    Descargar PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {filteredConsultas.length === 0 && searchTerm && (
            <div className="p-12 text-center text-gray-500 bg-white border border-dashed rounded-xl">
              No se encontraron reportes que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
