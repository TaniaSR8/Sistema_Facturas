/**
 * @typedef {'FACTURADO' | 'NO FACTURADO'} EstadoFactura
 */

/**
 * @typedef {'USUARIO' | 'BLUPSTER'} TipoDeduccion
 */

/**
 * @typedef {Object} ArchivosFactura
 * @property {boolean} pdf
 * @property {boolean} xml
 * @property {boolean} foto
 */

/**
 * @typedef {Object} Factura
 * @property {number} id
 * @property {string} razonSocial
 * @property {string} rfc
 * @property {string} fecha
 * @property {number} subtotal
 * @property {number} iva
 * @property {number} total
 * @property {string} gasto
 * @property {EstadoFactura} estado
 * @property {TipoDeduccion} deduccion
 * @property {string} usuarioSubio
 * @property {ArchivosFactura} archivos
 * @property {boolean} requiereSubida
 */

/**
 * @typedef {Object} FiltrosFacturas
 * @property {string} estado
 * @property {string} tipoGasto
 * @property {string} fechaDesde
 * @property {string} fechaHasta
 */

/**
 * @typedef {Object} PaginacionFacturas
 * @property {number} pagina
 * @property {number} porPagina
 */

/**
 * @typedef {Object} RespuestaFacturas
 * @property {Factura[]} data
 * @property {number} total
 * @property {number} pagina
 * @property {number} porPagina
 * @property {number} totalPaginas
 */

export {};
