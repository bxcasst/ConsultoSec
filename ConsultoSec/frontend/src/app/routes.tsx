import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { AdminLayout } from "./layouts/AdminLayout";
import { ConsultorLayout } from "./layouts/ConsultorLayout";
import { DashboardAdmin } from "./pages/admin/DashboardAdmin";
import { Solicitudes } from "./pages/admin/Solicitudes";
import { Usuarios } from "./pages/admin/Usuarios";
import { DashboardConsultor } from "./pages/consultor/DashboardConsultor";
import { CapacitacionesAdmin } from "./pages/admin/Capacitaciones";
import { CapacitacionesConsultor } from "./pages/consultor/Capacitaciones";
import { Checklist } from "./pages/consultor/Checklist";
import { MisAuditorias } from "./pages/consultor/Auditorias";
import { Seguimiento } from "./pages/consultor/Seguimiento";
import { Reportes } from "./pages/admin/Reportes";
import { ReportesConsultor } from "./pages/consultor/Reportes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardAdmin /> },
      { path: "solicitudes", element: <Solicitudes /> },
      { path: "usuarios", element: <Usuarios /> },
      { path: "capacitaciones", element: <CapacitacionesAdmin /> },
      { path: "seguimiento", element: <Seguimiento /> },
      { path: "reportes", element: <Reportes /> },
    ],
  },
  {
    path: "/consultor",
    element: <ConsultorLayout />,
    children: [
      { index: true, element: <DashboardConsultor /> },
      { path: "capacitaciones", element: <CapacitacionesConsultor /> },
      { path: "auditorias", element: <MisAuditorias /> },
      { path: "checklist", element: <Checklist /> },
      { path: "seguimiento", element: <Seguimiento /> },
      { path: "reportes", element: <ReportesConsultor /> },
    ],
  },
]);
