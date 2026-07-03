import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import AdminFacturas from "./pages/AdminFacturas";
import RutaPrivada from "./RutaPrivada";
import AdminValidaciones from './pages/AdminValidaciones';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir la raíz a Admin */}
        <Route path="/" element={<Navigate to="/admin/facturas" replace />} />

        {/* Pantalla Admin protegida */}
        <Route
          path="/admin/facturas"
          element={
            <RutaPrivada>
              <AdminFacturas />
            </RutaPrivada>
          }
        />

         {/* Pantalla Validaciones protegida - NUEVO */}
        <Route
          path="/admin/validaciones"
          element={
            <RutaPrivada>
              <AdminValidaciones />
            </RutaPrivada>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
