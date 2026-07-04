import { Navigate } from "react-router-dom";

const RutaPrivada = ({ children , rolPermitido}) => {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol"); // 👈 guardas el rol en login

   if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rolPermitido && rol !== rolPermitido) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RutaPrivada;
