import { Navigate } from "react-router-dom";

const esTokenExpirado = (token) => {
  if (!token) return true;
  try {
    const payloadParts = token.split(".");
    if (payloadParts.length < 2) return true;
    const payload = JSON.parse(atob(payloadParts[1]));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now > payload.exp;
  } catch (e) {
    return true;
  }
};

const RutaPrivada = ({ children , rolPermitido}) => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol"); // 👈 guardas el rol en login

  if (!token || esTokenExpirado(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("correo");
    localStorage.removeItem("usuarioId");
    return <Navigate to="/login?expired=true" replace />;
  }

  if (rolPermitido && rol !== rolPermitido) {
    // Si ya está autenticado pero intenta acceder a la pantalla de otro rol,
    // redirigir a su pantalla de inicio correspondiente en lugar de desloguearlo
    if (rol === "SUPERADMIN") {
      return <Navigate to="/usuarios" replace />;
    } else if (rol === "ADMINISTRADOR") {
      return <Navigate to="/admin/facturas" replace />;
    } else if (rol === "USUARIO") {
      return <Navigate to="/usuario/foto-ticket" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RutaPrivada;
