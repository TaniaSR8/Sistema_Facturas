import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RutaPrivada from "./RutaPrivada";


// 👇 Pantallas de Usuario
import USubirFoto from "./pages/USubirFoto";
import USubirFactura from "./pages/USubirFactura";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir la raíz a la primera pantalla */}
        <Route path="/" element={<Navigate to="/usuario/foto-ticket" replace />} />

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
        } />
      </Routes>
    </Router>
  );
}

export default App;
