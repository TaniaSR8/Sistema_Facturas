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
            <RutaPrivada>
              <PrincipalSuperAdmin />
                 </RutaPrivada>
          }
        />
         <Route
          path="/gastos"
          element={
            <RutaPrivada>
              <Gastos />
            </RutaPrivada>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaPrivada>
              <PerfilSuperAdmin />
            </RutaPrivada>
          }
        />

         {/* Pantallas de Usuario protegidas */}
        <Route
          path="/usuario/foto-ticket"
          element={
            <RutaPrivada>
              <USubirFoto />
            </RutaPrivada>
          }
        />
        
       <Route
          path="/usuario/factura"
          element={
            <RutaPrivada>
              <USubirFactura />
            </RutaPrivada>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;