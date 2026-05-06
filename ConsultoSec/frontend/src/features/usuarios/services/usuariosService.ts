export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const usuariosService = {
  async obtenerUsuarios(token: string): Promise<Usuario[]> {
    const response = await fetch(`${API_URL}/users/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener los usuarios");
    }

    return response.json();
  },

  async crearUsuario(token: string, data: Partial<Usuario> & { password?: string }): Promise<Usuario> {
    const response = await fetch(`${API_URL}/users/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Intentar parsear los errores específicos del backend
      try {
        const errorData = await response.json();
        const messages: string[] = [];

        if (errorData.username) {
          messages.push(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
        }
        if (errorData.email) {
          messages.push(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
        }

        if (messages.length > 0) {
          throw new Error(messages.join(' '));
        }

        // Si hay otros errores no mapeados
        const allMessages = Object.values(errorData).flat().join(' ');
        if (allMessages) throw new Error(allMessages);
      } catch (e) {
        if (e instanceof Error && e.message !== 'Error al crear el usuario') throw e;
      }
      throw new Error("Error al crear el usuario");
    }
    return response.json();
  },

  async actualizarEstado(token: string, id: number, isActive: boolean): Promise<Usuario> {
    const response = await fetch(`${API_URL}/users/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!response.ok) throw new Error("Error al actualizar el estado del usuario");
    return response.json();
  },

  async actualizarUsuario(token: string, id: number, data: Partial<Usuario>): Promise<Usuario> {
    const response = await fetch(`${API_URL}/users/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const messages: string[] = [];

        if (errorData.username) {
          messages.push(Array.isArray(errorData.username) ? errorData.username[0] : errorData.username);
        }
        if (errorData.email) {
          messages.push(Array.isArray(errorData.email) ? errorData.email[0] : errorData.email);
        }

        if (messages.length > 0) {
          throw new Error(messages.join(' '));
        }

        const allMessages = Object.values(errorData).flat().join(' ');
        if (allMessages) throw new Error(allMessages);
      } catch (e) {
        if (e instanceof Error && e.message !== 'Error al actualizar el usuario') throw e;
      }
      throw new Error("Error al actualizar el usuario");
    }
    return response.json();
  }
};
