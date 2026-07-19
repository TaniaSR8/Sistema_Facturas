import React from "react";
import "../css/ModalDetalleFactura.css";

const IconoCerrar = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconoPdf = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

const IconoXml = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const claseBadgeEstado = (estado) => {
  if (estado === "FACTURADO") return "amdf-badge-estado--validada";
  if (estado === "NO FACTURADO") return "amdf-badge-estado--rechazada";
  return "amdf-badge-estado--pendiente";
};

const etiquetaEstado = (estado) => {
  if (estado === "FACTURADO") return "Validada";
  if (estado === "NO FACTURADO") return "Rechazada";
  return "Pendiente";
};

const formatoMoneda = (valor) =>
  valor == null
    ? "—"
    : Number(valor).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/**
 * Modal de solo lectura con el detalle de una factura.
 *
 * Props:
 * - factura: objeto con { id, numeroFactura, fecha, rfc, razonSocial,
 *            tipoGasto, estado, total, pdfUrl, xmlUrl }
 *            Si es null/undefined, el modal no se renderiza.
 * - onClose: () => void
 */
export default function ModalDetalleFactura({ factura, onClose }) {
  if (!factura) return null;

  const handleVerPdf = () => {
    if (factura.pdfUrl) window.open(factura.pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleVerXml = () => {
    if (factura.xmlUrl) window.open(factura.xmlUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="amdf-overlay" onClick={onClose}>
      <div
        className="amdf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amdf-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Encabezado ---------- */}
        <div className="amdf-header">
          <h2 id="amdf-titulo" className="amdf-titulo">
            Detalle de Factura #F-{factura.id}
          </h2>
          <button
            type="button"
            className="amdf-btn-cerrar-icono"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>

        {/* ---------- Contenido ---------- */}
        <div className="amdf-contenido">
          <div className="amdf-datos-grid">
            <div className="amdf-dato">
              <span className="amdf-dato-etiqueta">Número de factura</span>
              <span className="amdf-dato-valor">{factura.numeroFactura || "—"}</span>
            </div>

            <div className="amdf-dato">
              <span className="amdf-dato-etiqueta">Fecha de emisión</span>
              <span className="amdf-dato-valor">{factura.fecha || "—"}</span>
            </div>

            <div className="amdf-dato">
              <span className="amdf-dato-etiqueta">RFC del emisor</span>
              <span className="amdf-dato-valor">{factura.rfc || "—"}</span>
            </div>

            <div className="amdf-dato amdf-dato--completo">
              <span className="amdf-dato-etiqueta">Razón social</span>
              <span className="amdf-dato-valor">{factura.razonSocial || "—"}</span>
            </div>

            <div className="amdf-dato">
              <span className="amdf-dato-etiqueta">Tipo de gasto</span>
              <span className="amdf-dato-valor">{factura.tipoGasto || "—"}</span>
            </div>

            <div className="amdf-dato">
              <span className="amdf-dato-etiqueta">Estado de validación</span>
              <span className={`amdf-badge-estado ${claseBadgeEstado(factura.estado)}`}>
                <span className="amdf-badge-estado-punto" />
                {etiquetaEstado(factura.estado)}
              </span>
            </div>
          </div>

          <div className="amdf-total-box">
            <span className="amdf-total-etiqueta">Monto total</span>
            <span className="amdf-total-monto">{formatoMoneda(factura.total)}</span>
          </div>
        </div>

        {/* ---------- Acciones ---------- */}
        <div className="amdf-acciones">
          <button
            type="button"
            className="amdf-btn amdf-btn--pdf"
            onClick={handleVerPdf}
            disabled={!factura.pdfUrl}
            title={!factura.pdfUrl ? "PDF no disponible" : undefined}
          >
            <IconoPdf />
            Ver PDF
          </button>
          <button
            type="button"
            className="amdf-btn amdf-btn--xml"
            onClick={handleVerXml}
            disabled={!factura.xmlUrl}
            title={!factura.xmlUrl ? "XML no disponible" : undefined}
          >
            <IconoXml />
            Ver XML
          </button>
          <button type="button" className="amdf-btn amdf-btn--cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}