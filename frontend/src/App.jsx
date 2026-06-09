import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import RecuperarContrasena from "./pages/RecuperarContrasena";
import CodigoOtp from "./pages/codigoOtp";
import RestablecerContrasena from "./pages/RestablecerContrasena";



function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir la raíz a login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Pantalla de login */}
        <Route path="/login" element={<Login />} />

        {/* 2. Nueva ruta para la pantalla de recuperar contraseña */}
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

        {/* 2. Añadimos la ruta para la verificación del código OTP */}
        <Route path="/verificar-codigo" element={<CodigoOtp />} />

        {/* 2. Añadimos la ruta para la creación de la nueva contraseña */}
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

      </Routes>
    </Router>
  );
}

export default App;