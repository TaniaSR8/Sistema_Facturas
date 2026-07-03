import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3031/api", // ajusta al puerto de tu backend
  headers: {
    "Content-Type": "application/json",
  },
});

export const obtenerMensajeErrorApi = (error) => {
  if (error.response?.data?.mensaje) {
    return error.response.data.mensaje;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
};

export default api;