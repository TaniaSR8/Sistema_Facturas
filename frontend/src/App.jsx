import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrincipalSuperAdmin from './pages/PrincipalSuperAdmin';
import PerfilSuperAdmin from './pages/PerfilSuperAdmin';
import Gastos from './pages/Gastos';
import Login from './pages/Login';
import RecuperarContrasena from "./pages/RecuperarContrasena";
import CodigoOtp from "./pages/codigoOtp";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import RutaPrivada from "./components/RutaPrivada"; // 👈 Importa tu componente

// 👇 Pantallas de Usuario
import USubirFoto from "./pages/USubirFoto";
import USubirFactura from "./pages/USubirFactura";

import UMisFotografias from "./pages/UMisFotografias";
import UDashboard from "./pages/UDashboard";
import UPerfil from "./pages/UPerfil";

import AdminFacturas from "./pages/AdminFacturas";
import AdminValidaciones from './pages/AdminValidaciones';


function App() {
  return (
    <Router>
      <Routes>

        {/* Redirigir la raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Pantallas de autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/verificar-codigo" element={<CodigoOtp />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

        {/* Pantallas de SuperAdmin protegidas */}
        <Route
            path="/usuarios"
            element={
              <RutaPrivada rolPermitido="SUPERADMIN">
                <PrincipalSuperAdmin />
              </RutaPrivada>
            }
          />

          <Route
          path="/gastos"
          element={
            <RutaPrivada rolPermitido="SUPERADMIN">
              <Gastos />
            </RutaPrivada>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaPrivada rolPermitido="SUPERADMIN">
              <PerfilSuperAdmin />
            </RutaPrivada>
          }
        />

        {/* Pantallas de Usuario protegidas */}
        <Route
          path="/usuario/foto-ticket"
          element={
            <RutaPrivada rolPermitido="USUARIO">
              <USubirFoto />
            </RutaPrivada>
          }
        />
        <Route
          path="/usuario/factura"
          element={
            <RutaPrivada rolPermitido="USUARIO">
              <USubirFactura />
            </RutaPrivada>
          }
        />


                  
          <Route
            path="/usuario/mis-fotografias"
            element={
              <RutaPrivada rolPermitido="USUARIO">
                <UMisFotografias />
              </RutaPrivada>
            }
          />

          
          <Route
  path="/usuario/dashboard"
  element={
    <RutaPrivada rolPermitido="USUARIO">
      <UDashboard />
    </RutaPrivada>
  }
/>

<Route
  path="/usuario/perfil"
  element={
    <RutaPrivada rolPermitido="USUARIO">
      <UPerfil />
    </RutaPrivada>
  }
/>

        {/* Pantallas de Admin protegidas */}
        <Route
          path="/admin/facturas"
          element={
            <RutaPrivada rolPermitido="ADMINISTRADOR">
              <AdminFacturas />
            </RutaPrivada>
          }
        />
        <Route
          path="/admin/validaciones"
          element={
            <RutaPrivada rolPermitido="ADMINISTRADOR">
              <AdminValidaciones />
            </RutaPrivada>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
