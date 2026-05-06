import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, ClipboardList, GraduationCap, FileText, LogOut, ChevronDown, KeyRound } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { usuariosService } from '../../features/usuarios/services/usuariosService';

export function ConsultorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');

  // Definición de las rutas principales del consultor
  const navItems = [
    { path: '/consultor', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/consultor/auditorias', label: 'Mis auditorías', icon: ClipboardList },
    { path: '/consultor/capacitaciones', label: 'Capacitaciones', icon: GraduationCap },
    { path: '/consultor/reportes', label: 'Reportes', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/consultor') {
      return location.pathname === '/consultor';
    }
    return location.pathname.startsWith(path);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setErrorPassword('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSaving(true);
    setErrorPassword('');
    try {
      await usuariosService.actualizarUsuario(token!, user!.id, { password: newPassword });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada correctamente', {
        className: "bg-green-100 text-green-800 border border-green-200"
      });
    } catch (error) {
      console.error(error);
      setErrorPassword('Error al cambiar la contraseña. Intente nuevamente.');
      toast.error('Ocurrió un error al intentar cambiar la contraseña', {
        className: "bg-red-100 text-red-800 border border-red-200"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen bg-[#F5F5F5] flex overflow-hidden">
      {/* Sidebar - Menú Lateral */}
      <aside className="w-64 bg-white border-r border-[#E8E8E8] flex flex-col h-full">
        {/* Logo Encapsulado para ocultar bordes grises */}
        <div className="p-6 border-b border-[#E8E8E8] flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-[#E8E8E8] shrink-0">
            <img
              src="/logo.png"
              alt="ConsultoSec Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <h2 className="text-[15px] font-bold text-[#003087] leading-tight">
              Sistema de Consultoria
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
              UNISON
            </p>
          </div>
        </div>

        {/* Navegación por Módulos */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] transition-colors ${active
                  ? 'bg-[#003087] text-white'
                  : 'text-gray-700 hover:bg-[#F5F5F5]'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sección de Salida */}
        <div className="p-4 border-t border-[#E8E8E8]">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] text-gray-700 hover:bg-[#F5F5F5] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra Superior con Perfil de Consultor */}
        <header className="bg-white border-b border-[#E8E8E8] px-8 py-3">
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 pr-3 rounded-xl transition-colors border border-transparent hover:border-[#E8E8E8]">
                  {/* Avatar con iniciales */}
                  <div className="w-9 h-9 rounded-full bg-[#003087] flex items-center justify-center text-white text-[13px] font-semibold tracking-wider uppercase">
                    {user ? user.first_name?.[0] : "JU"}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="text-[14px] font-semibold text-gray-900 leading-tight">
                      {user ? `${user.first_name} ${user.last_name}` : "Jesús Uzcanga"}
                    </span>
                    <span className="text-[12px] text-gray-500 font-medium">
                      {user ? user.role : "Consultor"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 bg-white">
                <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => setIsPasswordModalOpen(true)}>
                  <KeyRound className="w-4 h-4" />
                  Cambiar contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Espacio donde se cargarán las páginas (Dashboard, Auditorías, etc.) */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Modal Cambio de Contraseña */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Cambiar tu contraseña</DialogTitle>
            <DialogDescription>
              Asegúrate de usar al menos 8 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            {errorPassword && (
              <p className="text-[13px] text-red-600 font-medium">{errorPassword}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setNewPassword('');
                setConfirmPassword('');
                setErrorPassword('');
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button className="bg-[#003087] hover:bg-[#002266] text-white" onClick={handlePasswordChange} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar nueva contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}