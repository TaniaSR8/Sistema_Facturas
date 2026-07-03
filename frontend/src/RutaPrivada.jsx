import { Navigate } from "react-router-dom";
import api from "./axios.js";


const RutaPrivada = ({ children }) => {
  return children; // 👈 así evitas el loop
};


export default RutaPrivada;