import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const msg = error.response.data?.mensaje || "";
      if (msg.toLowerCase().includes("expir") || error.response.data?.expired) {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        localStorage.removeItem("correo");
        localStorage.removeItem("usuarioId");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

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