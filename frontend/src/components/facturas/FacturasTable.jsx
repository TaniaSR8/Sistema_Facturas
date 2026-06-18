import { BADGE_GASTO_MAP } from '../../constants/facturas.js';
import { formatearMoneda, formatearFecha } from '../../services/facturasApi.js';
import { IconPdf, IconXml, IconFoto } from '../ui/Icons.jsx';

/**
 * @param {{ facturas: import('../../types/factura.js').Factura[], loading: boolean }} props
 */
export default function FacturasTable({ facturas, loading }) {
  const handleVerDetalle = (id) => {
    // TODO: Navegar a /facturas/:id cuando la ruta esté disponible
    console.info('Ver detalle factura:', id);
  };

  const handleSubirFactura = (id) => {
    // TODO: Abrir modal de subida cuando esté implementado
    console.info('Subir factura:', id);
  };

  if (loading) {
    return (
      <section className="table-section">
        <div className="table-loading">Cargando facturas...</div>
      </section>
    );
  }

  return (
    <section className="table-section">
      <div className="table-responsive-container">
        <table className="facturas-table">
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>RFC</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Gasto</th>
              <th>Estado</th>
              <th>Deducción</th>
              <th>Subido por</th>
              <th>Archivos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 ? (
              <tr>
                <td colSpan={12} className="table-empty">
                  No se encontraron facturas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              facturas.map((f) => (
                <tr key={f.id}>
                  <td className="col-razon">{f.razonSocial}</td>
                  <td>{f.rfc}</td>
                  <td>{formatearFecha(f.fecha)}</td>
                  <td>{formatearMoneda(f.subtotal)}</td>
                  <td>{formatearMoneda(f.iva)}</td>
                  <td className="col-total">{formatearMoneda(f.total)}</td>
                  <td>
                    <span className={`badge ${BADGE_GASTO_MAP[f.gasto] || 'badge-general'}`}>
                      {f.gasto}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.estado === 'FACTURADO' ? 'badge-facturado' : 'badge-no-facturado'}`}>
                      {f.estado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.deduccion === 'USUARIO' ? 'badge-usuario' : 'badge-blupster'}`}>
                      {f.deduccion}
                    </span>
                  </td>
                  <td className="col-usuario">{f.usuarioSubio}</td>
                  <td>
                    <div className="file-icons">
                      {f.archivos.pdf && <span title="PDF"><IconPdf /></span>}
                      {f.archivos.xml && <span title="XML"><IconXml /></span>}
                      {f.archivos.foto && <span title="Foto"><IconFoto /></span>}
                    </div>
                  </td>
                  <td>
                    {f.requiereSubida ? (
                      <button
                        type="button"
                        className="btn-subir-factura"
                        onClick={() => handleSubirFactura(f.id)}
                      >
                        SUBIR FACTURA
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-detalle"
                        onClick={() => handleVerDetalle(f.id)}
                      >
                        Ver detalle
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
