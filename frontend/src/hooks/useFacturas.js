import { useState, useEffect, useCallback } from 'react';
import { getFacturas } from '../services/facturasApi.js';
import { REGISTROS_POR_PAGINA } from '../constants/facturas.js';

/** @type {import('../types/factura.js').FiltrosFacturas} */
const FILTROS_INICIALES = {
  estado: '',
  tipoGasto: '',
  fechaDesde: '',
  fechaHasta: '',
};

/**
 * Hook para gestionar facturas con filtros y paginación.
 * Listo para conectar con el backend vía facturasApi.js
 */
export function useFacturas() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [facturas, setFacturas] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await getFacturas(filtros, {
        pagina,
        porPagina: REGISTROS_POR_PAGINA,
      });
      setFacturas(respuesta.data);
      setTotal(respuesta.total);
      setTotalPaginas(respuesta.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  /** @param {Partial<import('../types/factura.js').FiltrosFacturas>} nuevosFiltros */
  const actualizarFiltros = (nuevosFiltros) => {
    setFiltros((prev) => ({ ...prev, ...nuevosFiltros }));
    setPagina(1);
  };

  const irAPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPagina(nuevaPagina);
    }
  };

  return {
    facturas,
    filtros,
    pagina,
    total,
    totalPaginas,
    porPagina: REGISTROS_POR_PAGINA,
    loading,
    error,
    actualizarFiltros,
    irAPagina,
    recargar: cargarFacturas,
  };
}
