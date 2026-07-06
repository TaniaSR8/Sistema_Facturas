import api, { obtenerMensajeErrorApi } from "../axios";

export const getFacturas = async () => {
  try {
    return await api.get("/facturas");
  } catch (error) {
    throw new Error(obtenerMensajeErrorApi(error));
  }
};

export const marcarDeducible = async (id) => {
  try {
    return await api.put(`/facturas/marcar-deducible/${id}`);
  } catch (error) {
    throw new Error(obtenerMensajeErrorApi(error));
  }
};

export const marcarNoDeducible = async (id) => {
  try {
    return await api.put(`/facturas/marcar-no-deducible/${id}`);
  } catch (error) {
    throw new Error(obtenerMensajeErrorApi(error));
  }
};
