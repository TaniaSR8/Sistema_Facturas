import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api", // ajusta según tu backend
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const obtenerMensajeErrorApi = (error) => {
  if (!error.response) {
    return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 3001.";
  }

  const data = error.response.data;
  return (
    data?.error ||
    data?.message ||
    data?.mensaje ||
    `Error del servidor (${error.response.status})`
  );
};

export default api;
