import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';

import RecuperarContrasena from "./pages/RecuperarContrasena";



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

      </Routes>
    </Router>
  );
}

export default App;