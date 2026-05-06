import { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Plus, Loader2, Pencil, Key, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useAuth } from '../../../features/auth/AuthContext';
import { usuariosService, Usuario } from '../../../features/usuarios/services/usuariosService';

export function Usuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // States para el form normal
  const [newUsuario, setNewUsuario] = useState({
    nombre: '',
    correo: '',
    rol: '' as 'Administrador' | 'Consultor' | '',
  });

  // States para el form de cambiar contraseña
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdUserId, setPwdUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchUsuarios = () => {
    if (token) {
      usuariosService.obtenerUsuarios(token)
        .then(data => {
          setUsuarios(data.sort((a, b) => b.id - a.id));
          setLoading(false);
        })
        .catch(err => {
          console.error("Error al cargar usuarios:", err);
          toast.error("Error de conexión", {
            description: <span style={{ color: '#4b5563' }}>No se pudieron cargar los usuarios existentes.</span>,
            position: 'top-right',
            classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
          });
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [token]);

  const openNewModal = () => {
    setEditingUserId(null);
    setNewUsuario({ nombre: '', correo: '', rol: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUserId(user.id);
    setNewUsuario({
      nombre: `${user.first_name} ${user.last_name}`.trim() || user.username,
      correo: user.email,
      rol: user.role === 'ADMIN' ? 'Administrador' : 'Consultor'
    });
    setIsModalOpen(true);
  };

  const openPwdModal = (user: Usuario) => {
    setPwdUserId(user.id);
    setNewPassword('');
    setConfirmPassword('');
    setIsPwdModalOpen(true);
  };

  const handleSaveUsuario = async () => {
    if (newUsuario.nombre && newUsuario.correo && newUsuario.rol) {
      setSubmitting(true);
      try {
        const parts = newUsuario.nombre.trim().split(' ');
        const first_name = parts[0];
        const last_name = parts.slice(1).join(' ');

        const backendRole = newUsuario.rol === 'Administrador' ? 'ADMIN' : 'CONSULTOR';

        if (editingUserId) {
          const payload = {
            first_name,
            last_name,
            email: newUsuario.correo,
            role: backendRole,
          };
          const modificado = await usuariosService.actualizarUsuario(token!, editingUserId, payload);
          setUsuarios(usuarios.map(u => u.id === editingUserId ? modificado : u));
          toast.success("Usuario actualizado", {
            description: <span style={{ color: '#4b5563' }}>Se actualizaron los datos exitosamente.</span>,
            position: 'top-right',
            classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
          });
        } else {
          const username = newUsuario.correo.split('@')[0];
          const payload = {
            first_name,
            last_name,
            email: newUsuario.correo,
            username: username,
            password: 'ConsultoSec_2026',
            role: backendRole,
            is_active: true
          };
          const creado = await usuariosService.crearUsuario(token!, payload);
          setUsuarios([creado, ...usuarios]);
          toast.success("Usuario registrado", {
            description: <span style={{ color: '#4b5563' }}>El usuario @{username} ha sido creado.</span>,
            position: 'top-right',
            classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
          });
        }

        setIsModalOpen(false);
      } catch (err: any) {
        console.error(err);
        const errorMsg = err?.message || '';
        
        // Determinar el título y descripción basándose en el tipo de error
        let title = "No se pudo guardar";
        let description = "Verifica que los datos sean correctos e intenta de nuevo.";
        
        if (errorMsg.includes('nombre de usuario') && errorMsg.includes('correo')) {
          title = "Usuario y correo duplicados";
          description = errorMsg;
        } else if (errorMsg.includes('nombre de usuario')) {
          title = "Usuario duplicado";
          description = errorMsg;
        } else if (errorMsg.includes('correo')) {
          title = "Correo duplicado";
          description = errorMsg;
        }
        
        toast.error(title, {
          description: <span style={{ color: '#4b5563' }}>{description}</span>,
          position: 'top-right',
          classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      toast.warning("Campos obligatorios", {
        description: <span style={{ color: '#4b5563' }}>Asegúrate de rellenar todos los datos solicitados.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Contraseña inválida", {
        description: <span style={{ color: '#4b5563' }}>La contraseña debe tener al menos 6 caracteres.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Error de validación", {
        description: <span style={{ color: '#4b5563' }}>Las contraseñas no coinciden.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
      return;
    }

    setSubmitting(true);
    try {
      await usuariosService.actualizarUsuario(token!, pwdUserId!, { password: newPassword });
      setIsPwdModalOpen(false);
      toast.success("Contraseña protegida", {
        description: <span style={{ color: '#4b5563' }}>El acceso se ha modificado exitosamente.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
    } catch (err) {
      console.error(err);
      toast.error("Error con servidor", {
        description: <span style={{ color: '#4b5563' }}>No fue posible actualizar la contraseña.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
    } finally {
      setSubmitting(false);
    }
  }

  const toggleUsuarioActivo = async (id: number, currentStatus: boolean) => {
    try {
      const nuevoStatus = !currentStatus;
      await usuariosService.actualizarEstado(token!, id, nuevoStatus);
      setUsuarios(
        usuarios.map((usuario) =>
          usuario.id === id ? { ...usuario, is_active: nuevoStatus } : usuario
        )
      );
      toast.success("Cambio de estatus", {
        description: <span style={{ color: '#4b5563' }}>{nuevoStatus ? "Permiso otorgado." : "Acceso revocado."}</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
    } catch (error) {
      console.error(error);
      toast.error("Conexión fallida", {
        description: <span style={{ color: '#4b5563' }}>El cambio de estatus no pudo completarse.</span>,
        position: 'top-right',
        classNames: { title: 'text-slate-900', description: 'text-slate-600 font-medium' }
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#003087] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-gray-900">
            Usuarios del sistema
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Gestión de administradores y consultores
          </p>
        </div>

        {/* Modal Principal (Nuevo/Editar) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewModal} className="bg-[#003087] hover:bg-[#002366] text-white gap-2">
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[18px]">
                {editingUserId ? "Editar usuario" : "Crear nuevo usuario"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">

              {!editingUserId && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-[13px] border border-blue-100 leading-relaxed">
                  <p><strong>Nota de seguridad:</strong> El sistema generará el username en base al correo. La <strong>contraseña inicial es "ConsultoSec_2026"</strong> (debes instruir al usuario para cambiarla luego).</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez García"
                  value={newUsuario.nombre}
                  onChange={(e) =>
                    setNewUsuario({ ...newUsuario, nombre: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo">Correo electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="correo@unison.mx"
                  value={newUsuario.correo}
                  onChange={(e) =>
                    setNewUsuario({ ...newUsuario, correo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select
                  value={newUsuario.rol}
                  onValueChange={(value: 'Administrador' | 'Consultor') =>
                    setNewUsuario({ ...newUsuario, rol: value })
                  }
                >
                  <SelectTrigger id="rol">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Consultor">Consultor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={submitting}
                  className="flex-1 bg-[#003087] hover:bg-[#002366] text-white"
                  onClick={handleSaveUsuario}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingUserId ? "Actualizar" : "Crear usuario")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Password */}
        <Dialog open={isPwdModalOpen} onOpenChange={setIsPwdModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Cambiar contraseña</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="pwd">Nueva Contraseña</Label>
                <Input
                  id="pwd"
                  type="password"
                  placeholder="Escribe la nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwdConfirm">Confirmar Contraseña</Label>
                <Input
                  id="pwdConfirm"
                  type="password"
                  placeholder="Vuelve a escribir la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsPwdModalOpen(false)}>
                  Cancelar
                </Button>
                <Button disabled={submitting} className="flex-1 bg-[#003087] hover:bg-[#002366] text-white" onClick={handleSavePassword}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <Input
          placeholder="Buscar por nombre..."
          className="pl-9 h-9 text-[13px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#E8E8E8] shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F5F5F5] hover:bg-[#F5F5F5]">
              <TableHead className="text-[14px] font-medium">Nombre</TableHead>
              <TableHead className="text-[14px] font-medium">Username</TableHead>
              <TableHead className="text-[14px] font-medium">Correo</TableHead>
              <TableHead className="text-[14px] font-medium">Rol</TableHead>
              <TableHead className="text-[14px] font-medium">Estado</TableHead>
              <TableHead className="text-[14px] font-medium">Fecha de registro</TableHead>
              <TableHead className="text-[14px] font-medium text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.filter((usuario) => {
              const nombreCompleto = `${usuario.first_name} ${usuario.last_name}`.trim().toLowerCase();
              return nombreCompleto.includes(searchTerm.toLowerCase());
            }).map((usuario) => {
              const nombreCompleto = `${usuario.first_name} ${usuario.last_name}`.trim() || usuario.username;
              const displayRole = usuario.role === 'ADMIN' ? 'Administrador' : 'Consultor';
              const isActivo = usuario.is_active;

              const dateStr = usuario.date_joined
                ? new Date(usuario.date_joined).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : "Reciente";

              return (
                <TableRow
                  key={usuario.id}
                  className={`hover:bg-[#F5F5F5] ${!isActivo ? 'bg-gray-50 opacity-60' : ''}`}
                >
                  <TableCell className="text-[14px] font-medium">
                    {nombreCompleto}
                  </TableCell>
                  <TableCell className="text-[13px] text-gray-500 font-mono">
                    @{usuario.username}
                  </TableCell>
                  <TableCell className="text-[14px] text-gray-600">
                    {usuario.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${displayRole === 'Administrador'
                        ? 'bg-[#003087] text-white'
                        : 'bg-[#1D9E75] text-white'
                        } text-[11px] shadow-none border-none py-0.5 px-2 hover:opacity-90`}
                    >
                      {displayRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActivo}
                        onCheckedChange={() => toggleUsuarioActivo(usuario.id, isActivo)}
                        className="data-[state=checked]:bg-[#1D9E75]"
                      />
                      <span className="text-[13px] text-gray-600 font-medium">
                        {isActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] text-gray-500">
                    {dateStr}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditModal(usuario)}
                        className="h-8 w-8 rounded-md border-[#E8E8E8] hover:bg-blue-50 text-[#003087]"
                        title="Editar usuario"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openPwdModal(usuario)}
                        className="h-8 w-8 rounded-md border-[#E8E8E8] hover:bg-orange-50 text-orange-600"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
