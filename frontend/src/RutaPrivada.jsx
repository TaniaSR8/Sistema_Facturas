import { Navigate } from "react-router-dom";

const RutaPrivada = ({ children }) => {
  return children; // 👈 así evitas el loop
};


export default RutaPrivada;
