import React, { useState, useEffect } from "react";
import api, { obtenerMensajeErrorApi } from "../axios";
import { useToast } from "./Toast";
import "../css/ModalSubirFactura.css";


import { getDeducciones } from "../services/deduccionesService";


// El id que llega aquí puede ser:
// - "p-12"  -> foto pendiente #12 (no tiene factura todavía, es el caso normal)
// - "f-8"   -> factura ya existente (hoy no debería pasar, se deja por si acaso)
const parsearId = (idParam) => {
  if (!idParam) return { tipo: null, id: null };
  const [prefijo, valor] = idParam.split("-");
  if (prefijo === "p") return { tipo: "foto", id: valor };
  if (prefijo === "f") return { tipo: "factura", id: valor };
  return { tipo: null, id: idParam };
};

const IconoZoom = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

/**
 * Modal para completar una factura (adjuntar XML + PDF) a partir de una
 * foto pendiente. Reemplaza a la pantalla completa AdminSubirFactura.
 *
 * Props:
 * - idParam: string  -> mismo formato que antes recibía por useParams ("p-12")
 * - onClose: () => void      -> cierra el modal sin recargar nada
 * - onExito: () => void      -> se llama cuando la factura se vinculó correctamente
 *                                (útil para refrescar la tabla de AdminFacturas)
 */
export default function ModalSubirFactura({ idParam, onClose, onExito }) {
  const { addToast } = useToast();

  const { tipo, id } = parsearId(idParam);

  const [zoomAbierto, setZoomAbierto] = useState(false);

  const [foto, setFoto] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(true);
  const [errorFoto, setErrorFoto] = useState("");

  const [archivoXml, setArchivoXml] = useState(null);
  const [archivoPdf, setArchivoPdf] = useState(null);

  // ---------- Deducción: la trae la foto si el usuario ya la eligió;
  // si no, el admin la selecciona manualmente aquí ----------
  const [deducciones, setDeducciones] = useState([]);
  const [deduccionId, setDeduccionId] = useState("");

  const [datosFactura, setDatosFactura] = useState({
    emisor_rfc: "",
    emisor_nombre: "",
    fecha: "",
    subtotal: "",
    total: "",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Carga los datos de la foto pendiente (usuario dueño, deducción que
  // ya eligió, tipo de gasto, etc.) para que el admin sepa qué está completando.
  useEffect(() => {
    const cargarFoto = async () => {
      if (tipo !== "foto") {
        setCargandoFoto(false);
        return;
      }
      setCargandoFoto(true);
      setErrorFoto("");
      try {
        const { data } = await api.get(`/fotos/${id}`);
        setFoto(data);
        // Si la foto ya trae una deducción elegida por el usuario, la
        // preseleccionamos; si no, queda vacía para que el admin elija.
        setDeduccionId(data?.deduccion_id ? String(data.deduccion_id) : "");
      } catch (err) {
        setErrorFoto(obtenerMensajeErrorApi(err));
      } finally {
        setCargandoFoto(false);
      }
    };
    cargarFoto();
  }, [tipo, id]);

  // Catálogo de deducciones, por si el admin tiene que elegirla manualmente
  useEffect(() => {
    const cargarDeducciones = async () => {
      try {
        const res = await getDeducciones();
        setDeducciones(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.warn("No se pudo cargar el catálogo de deducciones.", err);
      }
    };
    cargarDeducciones();
  }, []);

  // Bloquea el scroll del fondo mientras el modal está abierto
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleSeleccionXml = (e) => {
    setArchivoXml(e.target.files?.[0] || null);
    setError("");
    setExito("");
  };

  const handleSeleccionPdf = (e) => {
    setArchivoPdf(e.target.files?.[0] || null);
    setError("");
    setExito("");
  };

  const handleCancelar = () => {
    onClose?.();
  };

  const handleSubir = async () => {
    setError("");
    setExito("");

    if (!archivoXml || !archivoPdf) {
      const msg = "Debes seleccionar el archivo XML y el archivo PDF antes de subir la factura.";
      setError(msg);
      addToast(msg, "error");
      return;
    }

    if (!foto?.usuario_id) {
      const msg = "No se pudo determinar el usuario dueño de este comprobante.";
      setError(msg);
      addToast(msg, "error");
      return;
    }

    if (!deduccionId) {
      const msg = "Selecciona una opción de deducción antes de subir la factura.";
      setError(msg);
      addToast(msg, "error");
      return;
    }

    const formData = new FormData();
    formData.append("xml", archivoXml);
    formData.append("pdf", archivoPdf);
    formData.append("usuarioId", foto.usuario_id);
    formData.append("deduccion_id", deduccionId);
    formData.append("fotoId", foto.id);

    try {
      setCargando(true);
      const respuesta = await api.post("/facturas/subir", formData);

      const datos = respuesta.data.datos || {};
      setDatosFactura({
        emisor_rfc: datos.emisor_rfc || "",
        emisor_nombre: datos.emisor_nombre || "",
        fecha: datos.fecha || "",
        subtotal: datos.subtotal ?? "",
        total: datos.total ?? "",
      });

      setExito("Factura vinculada correctamente a la fotografía del usuario.");
      addToast("Factura vinculada correctamente.", "success");

      setTimeout(() => {
        onExito?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      setError(msg);
      addToast(msg, "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="asf-modal-overlay" onClick={handleCancelar}>
      <div className="asf-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="asf-modal-header">
          <h2 className="asf-modal-titulo">Completar Factura</h2>
          <button
            type="button"
            className="asf-modal-cerrar"
            onClick={handleCancelar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="asf-modal-contenido">
          {tipo !== "foto" && (
            <div className="asf-alerta asf-alerta--error">
              Esta ventana solo puede completar comprobantes pendientes (fotos sin factura). El
              identificador recibido no corresponde a ese caso.
            </div>
          )}

          {tipo === "foto" && cargandoFoto && (
            <div className="asf-cargando">Cargando datos del comprobante...</div>
          )}

          {tipo === "foto" && errorFoto && (
            <div className="asf-alerta asf-alerta--error">{errorFoto}</div>
          )}

          {tipo === "foto" && !cargandoFoto && foto && (
            <>
              {/* ---------- Info de la foto pendiente ---------- */}
              <section className="asf-card asf-card--info">
                <div className="asf-info-layout">
                  <button
                    type="button"
                    className="asf-foto-grande-wrapper"
                    onClick={() => setZoomAbierto(true)}
                    title="Clic para ampliar"
                  >
                    <img src={foto.fotoUrl} alt="Comprobante" className="asf-foto-grande" />
                    <span className="asf-foto-grande-overlay">
                      <IconoZoom />
                      Ver en grande
                    </span>
                  </button>

                  <div className="asf-info-datos">
                    <div className="asf-info-texto">
                      <span className="asf-info-etiqueta">Usuario</span>
                      <span className="asf-info-valor">{foto.nombreUsuario || "—"}</span>
                    </div>
                    <div className="asf-info-texto">
                      <span className="asf-info-etiqueta">Concepto</span>
                      <span className="asf-info-valor">{foto.descripcion || "—"}</span>
                    </div>
                    <div className="asf-info-texto">
                      <span className="asf-info-etiqueta">Monto capturado</span>
                      <span className="asf-info-valor">
                        {foto.monto != null
                          ? Number(foto.monto).toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                          : "—"}
                      </span>
                    </div>

                    {/* ---------- Deducción: select editable ---------- */}
                    <div className="asf-info-texto asf-info-texto--deduccion">
                      <span className="asf-info-etiqueta">
                        Deducción <span className="asf-requerido">*</span>
                      </span>
                      <select
                        className="asf-select-deduccion"
                        value={deduccionId}
                        onChange={(e) => setDeduccionId(e.target.value)}
                      >
                        <option value="">Seleccionar deducción</option>
                        {deducciones.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.descripcion}
                          </option>
                        ))}
                      </select>
                      {!foto.deduccion_id && (
                        <span className="asf-nota-deduccion">
                          El usuario no eligió deducción al capturar la foto; selecciónala tú.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {error && <div className="asf-alerta asf-alerta--error">{error}</div>}
              {exito && <div className="asf-alerta asf-alerta--exito">{exito}</div>}

              {/* ---------- Formulario de subida ---------- */}
              <section className="asf-card">
                <div className="asf-card-header">
                  <h2>Adjuntar XML y PDF</h2>
                </div>

                <div className="asf-card-body">
                  <div className="asf-uploads-grid">
                    <div className="asf-upload-columna">
                      <div className="asf-upload-etiqueta">
                        Comprobante XML <span className="asf-requerido">*</span>
                      </div>
                      <div className={"asf-upload-box" + (archivoXml ? " asf-upload-box--con-archivo" : "")}>
                        <input
                          type="file"
                          accept=".xml"
                          className="asf-upload-input"
                          onChange={handleSeleccionXml}
                        />
                        <span className="asf-upload-icono">{"{ }"}</span>
                        {archivoXml ? (
                          <span className="asf-upload-nombre-archivo" title={archivoXml.name}>
                            {archivoXml.name}
                          </span>
                        ) : (
                          <>
                            <span className="asf-upload-titulo">Seleccionar XML</span>
                            <span className="asf-upload-subtitulo">Solo archivos .xml</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="asf-upload-columna">
                      <div className="asf-upload-etiqueta">
                        Comprobante PDF <span className="asf-requerido">*</span>
                      </div>
                      <div className={"asf-upload-box" + (archivoPdf ? " asf-upload-box--con-archivo" : "")}>
                        <input
                          type="file"
                          accept=".pdf"
                          className="asf-upload-input"
                          onChange={handleSeleccionPdf}
                        />
                        <span className="asf-upload-icono">▤</span>
                        {archivoPdf ? (
                          <span className="asf-upload-nombre-archivo" title={archivoPdf.name}>
                            {archivoPdf.name}
                          </span>
                        ) : (
                          <>
                            <span className="asf-upload-titulo">Seleccionar PDF</span>
                            <span className="asf-upload-subtitulo">Solo archivos .pdf</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="asf-campos">
                    <div className="asf-campo">
                      <label>RFC</label>
                      <input type="text" value={datosFactura.emisor_rfc} readOnly placeholder="Se llena al subir" />
                    </div>
                    <div className="asf-campo">
                      <label>Razón Social</label>
                      <input type="text" value={datosFactura.emisor_nombre} readOnly placeholder="Se llena al subir" />
                    </div>
                    <div className="asf-campo">
                      <label>Fecha de Emisión</label>
                      <input type="text" value={datosFactura.fecha} readOnly placeholder="dd/mm/aaaa" />
                    </div>
                    <div className="asf-campo">
                      <label>Total sin IVA</label>
                      <input type="text" value={datosFactura.subtotal} readOnly placeholder="0.00" />
                    </div>
                    <div className="asf-campo">
                      <label>Total</label>
                      <input type="text" value={datosFactura.total} readOnly placeholder="0.00" />
                    </div>
                  </div>

                  <div className="asf-acciones">
                    <button
                      type="button"
                      className="asf-btn asf-btn--secundario"
                      onClick={handleCancelar}
                      disabled={cargando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="asf-btn asf-btn--primario"
                      onClick={handleSubir}
                      disabled={cargando}
                    >
                      {cargando ? "Subiendo..." : "Subir y vincular"}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {zoomAbierto && foto?.fotoUrl && (
        <div className="asf-lightbox" onClick={() => setZoomAbierto(false)}>
          <button
            type="button"
            className="asf-lightbox-cerrar"
            onClick={() => setZoomAbierto(false)}
            aria-label="Cerrar vista ampliada"
          >
            ✕
          </button>
          <img src={foto.fotoUrl} alt="Comprobante ampliado" className="asf-lightbox-imagen" />
        </div>
      )}
    </div>
  );
}