export interface ChecklistItem {
  id: number;
  consulta: number;
  area: string;
  categoria: string;
  requisito: string;
  normativa_aplicable: string | null;
  cumple: 'si' | 'no' | 'parcial' | 'no_evaluado';
  observacion: string;
  mejora: string;
  comentarios: string;
  imagen: string | null;
}

export interface Consulta {
  id: number;
  notas: string;
  area_laboratorio: number | null;
  area_nombre: string | null;
  estado: 'agendada' | 'revision_previa' | 'revision_verificacion' | 'mejoras_solicitadas' | 'ultima_revision' | 'finalizada' | 'pendiente' | 'cancelada';
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_finalizacion: string | null;
  fecha_finalizacion_propuesta: string | null;
  items_checklist: ChecklistItem[];
  responsables: number[];
}

export interface AreaLaboratorio {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active?: boolean;
}

export interface CapacitacionArchivo {
  id: number;
  capacitacion: number;
  archivo: string;  // URL del archivo
  tipo: 'material' | 'evidencia';
  nombre: string;
  fecha_subida: string;
}

export interface Training {
  id: number;
  consultas: number[];
  laboratorios: number[];
  tema: string;
  descripcion: string;
  fecha: string;
  responsable: string;
  asistentes: number[];
  archivos: CapacitacionArchivo[];
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface PropuestaMejora {
  id: number;
  consulta: number;
  plazo: 'corto' | 'mediano' | 'largo';
  numero_tarea: string;
  accion_correctiva: string;
  responsables: string[];
  fecha_inicio: string | null;
  fecha_fin: string | null;
  duracion_dias: number;
  s_implementada: string;
  estado: string;
  aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const consultasService = {
  async obtenerConsultas(token: string): Promise<Consulta[]> {
    const response = await fetch(`${API_URL}/solicitudes/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener las consultas");
    }

    return response.json();
  },

  async obtenerConsulta(token: string, id: number): Promise<Consulta> {
    const response = await fetch(`${API_URL}/solicitudes/${id}/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener la consulta ${id}`);
    }

    return response.json();
  },

  async actualizarConsulta(token: string, id: number, data: Partial<Consulta>): Promise<Consulta> {
    const response = await fetch(`${API_URL}/solicitudes/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al actualizar la consulta");
    return response.json();
  },

  async actualizarChecklistItem(token: string, id: number, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const response = await fetch(`${API_URL}/checklists/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al actualizar el item del checklist");
    return response.json();
  },

  async obtenerAreas(token: string): Promise<AreaLaboratorio[]> {
    const response = await fetch(`${API_URL}/areas-laboratorio/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al obtener las áreas");
    return response.json();
  },

  async obtenerConsultores(token: string): Promise<Usuario[]> {
    const response = await fetch(`${API_URL}/users/consultores/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al obtener los consultores");
    return response.json();
  },

  async crearConsulta(token: string, data: Partial<Consulta>): Promise<Consulta> {
    const response = await fetch(`${API_URL}/solicitudes/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear la consulta");
    return response.json();
  },

  async obtenerCapacitaciones(token: string): Promise<Training[]> {
    const response = await fetch(`${API_URL}/capacitaciones/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al obtener capacitaciones");
    return response.json();
  },

  async crearCapacitacion(token: string, data: Partial<Training>): Promise<Training> {
    const response = await fetch(`${API_URL}/capacitaciones/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error("Error al crear la capacitación");
      error.response = { data: errorData };
      throw error;
    }
    return response.json();
  },

  async actualizarCapacitacion(token: string, id: number, data: Partial<Training>): Promise<Training> {
    const response = await fetch(`${API_URL}/capacitaciones/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error("Error al actualizar la capacitación");
      error.response = { data: errorData };
      throw error;
    }
    return response.json();
  },

  async subirArchivoCapacitacion(
    token: string,
    capacitacionId: number,
    file: File,
    tipo: 'material' | 'evidencia'
  ): Promise<CapacitacionArchivo> {
    const formData = new FormData();
    formData.append('capacitacion', capacitacionId.toString());
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    formData.append('nombre', file.name);

    const response = await fetch(`${API_URL}/capacitacion-archivos/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });
    if (!response.ok) throw new Error(`Error al subir archivo: ${file.name}`);
    return response.json();
  },

  async eliminarArchivoCapacitacion(token: string, archivoId: number): Promise<void> {
    const response = await fetch(`${API_URL}/capacitacion-archivos/${archivoId}/`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al eliminar el archivo");
  },

  async obtenerPropuestas(token: string, consultaId: number): Promise<PropuestaMejora[]> {
    const response = await fetch(`${API_URL}/propuestas/?consulta=${consultaId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al obtener las propuestas de mejora");
    return response.json();
  },

  async crearPropuesta(token: string, data: Partial<PropuestaMejora>): Promise<PropuestaMejora> {
    const response = await fetch(`${API_URL}/propuestas/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear la propuesta de mejora");
    return response.json();
  },

  async actualizarPropuesta(token: string, id: number, data: Partial<PropuestaMejora>): Promise<PropuestaMejora> {
    const response = await fetch(`${API_URL}/propuestas/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al actualizar la propuesta de mejora");
    return response.json();
  },

  async eliminarPropuesta(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/propuestas/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al eliminar la propuesta de mejora");
  },

  async descargarPDF(token: string, id: number): Promise<Blob> {
    const response = await fetch(`${API_URL}/solicitudes/${id}/pdf/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al descargar el PDF");
    return response.blob();
  },

  async eliminarConsulta(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/solicitudes/${id}/eliminar/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!response.ok) throw new Error("Error al eliminar la solicitud");
  }
};
