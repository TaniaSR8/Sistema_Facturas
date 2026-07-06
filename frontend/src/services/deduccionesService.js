import api, { obtenerMensajeErrorApi } from "../axios";

export const getDeducciones = async () => {
  try {
    return await api.get("/facturas/catalogos/deducciones");
  } catch (error) {
    throw new Error(obtenerMensajeErrorApi(error));
  }
};
