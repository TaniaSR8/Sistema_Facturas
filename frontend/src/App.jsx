import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrincipalSuperAdmin from './pages/PrincipalSuperAdmin';
import PerfilSuperAdmin from './pages/PerfilSuperAdmin';
import Gastos from './pages/Gastos';
import Login from './pages/Login';
import RecuperarContrasena from "./pages/RecuperarContrasena";
import CodigoOtp from "./pages/codigoOtp";
import RestablecerContrasena from "./pages/RestablecerContrasena";

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

        {/* Pantallas de SuperAdmin */}
        <Route path="/usuarios" element={<PrincipalSuperAdmin />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/perfil" element={<PerfilSuperAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;