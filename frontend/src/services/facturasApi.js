import { ENDPOINTS } from '../config/api.js';
import { REGISTROS_POR_PAGINA } from '../constants/facturas.js';

/** @type {import('../types/factura.js').Factura[]} */
const MOCK_FACTURAS = [
  {
    id: 1,
    razonSocial: 'Tech Solutions S.A.',
    rfc: 'MERL880412H34',
    fecha: '2023-10-24',
    subtotal: 10000,
    iva: 1600,
    total: 11600,
    gasto: 'Carro',
    estado: 'FACTURADO',
    deduccion: 'USUARIO',
    usuarioSubio: 'Juan Pérez',
    archivos: { pdf: true, xml: true, foto: false },
    requiereSubida: false,
  },
  {
    id: 2,
    razonSocial: 'Agencia Viajes MX',
    rfc: 'VACL901130ML1',
    fecha: '2023-10-22',
    subtotal: 4000,
    iva: 640,
    total: 4640,
    gasto: 'General',
    estado: 'NO FACTURADO',
    deduccion: 'BLUPSTER',
    usuarioSubio: 'Ana López',
    archivos: { pdf: false, xml: false, foto: false },
    requiereSubida: true,
  },
  {
    id: 3,
    razonSocial: 'Farmacia Guadalajara',
    rfc: 'SUMG001215A45',
    fecha: '2023-10-20',
    subtotal: 15400,
    iva: 2464,
    total: 17864,
    gasto: 'Salud',
    estado: 'FACTURADO',
    deduccion: 'USUARIO',
    usuarioSubio: 'Carlos Ruiz',
    archivos: { pdf: true, xml: false, foto: true },
    requiereSubida: false,
  },
  {
    id: 4,
    razonSocial: 'Global Logistics Corp',
    rfc: 'GLC850620PL2',
    fecha: '2023-10-18',
    subtotal: 15200,
    iva: 2432,
    total: 17632,
    gasto: 'General',
    estado: 'NO FACTURADO',
    deduccion: 'BLUPSTER',
    usuarioSubio: 'María González',
    archivos: { pdf: false, xml: false, foto: false },
    requiereSubida: true,
  },
];

/**
 * Formatea un monto en pesos mexicanos.
 * @param {number} monto
 */
export function formatearMoneda(monto) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(monto);
}

/**
 * Formatea una fecha ISO a formato legible.
 * @param {string} fechaISO
 */
export function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO + 'T12:00:00');
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Filtra facturas según los criterios proporcionados.
 * @param {import('../types/factura.js').Factura[]} facturas
 * @param {import('../types/factura.js').FiltrosFacturas} filtros
 */
function aplicarFiltros(facturas, filtros) {
  return facturas.filter((f) => {
    if (filtros.estado && f.estado !== filtros.estado) return false;
    if (filtros.tipoGasto && f.gasto !== filtros.tipoGasto) return false;
    if (filtros.fechaDesde && f.fecha < filtros.fechaDesde) return false;
    if (filtros.fechaHasta && f.fecha > filtros.fechaHasta) return false;
    return true;
  });
}

/**
 * Obtiene facturas paginadas y filtradas.
 * Reemplazar el bloque mock por fetch cuando el backend esté listo.
 *
 * @param {import('../types/factura.js').FiltrosFacturas} filtros
 * @param {import('../types/factura.js').PaginacionFacturas} paginacion
 * @returns {Promise<import('../types/factura.js').RespuestaFacturas>}
 */
export async function getFacturas(filtros, paginacion) {
  const porPagina = paginacion.porPagina || REGISTROS_POR_PAGINA;

  // TODO: Descomentar cuando el backend esté disponible
  // const params = new URLSearchParams({
  //   pagina: String(paginacion.pagina),
  //   porPagina: String(porPagina),
  //   ...(filtros.estado && { estado: filtros.estado }),
  //   ...(filtros.tipoGasto && { tipoGasto: filtros.tipoGasto }),
  //   ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
  //   ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta }),
  // });
  // const response = await fetch(`${ENDPOINTS.facturas}?${params}`);
  // if (!response.ok) throw new Error('Error al obtener facturas');
  // return response.json();

  await new Promise((resolve) => setTimeout(resolve, 300));

  const filtradas = aplicarFiltros(MOCK_FACTURAS, filtros);
  const totalMock = 128;
  const inicio = (paginacion.pagina - 1) * porPagina;
  const data = filtradas.slice(inicio, inicio + porPagina);

  return {
    data,
    total: totalMock,
    pagina: paginacion.pagina,
    porPagina,
    totalPaginas: Math.ceil(totalMock / porPagina),
  };
}

/**
 * @param {number} id
 * @returns {Promise<import('../types/factura.js').Factura>}
 */
export async function getFacturaById(id) {
  // TODO: fetch(`${ENDPOINTS.facturas}/${id}`)
  const factura = MOCK_FACTURAS.find((f) => f.id === id);
  if (!factura) throw new Error('Factura no encontrada');
  return factura;
}

export { ENDPOINTS };
