// import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/AdminValidaciones.css";
import React, { useState, useEffect } from "react";


/* ==========================================================================
   Iconos SVG (reemplazan a Material Symbols / emoticonos)
   Estilo lineal, monocromo, heredan color y tamaño del elemento padre.
   ========================================================================= */
const IconBase = ({ children, className = "", size }) => (
  <svg
    className={className}
    width={size || "1em"}
    height={size || "1em"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", flexShrink: 0 }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconMenu = (props) => (
  <IconBase {...props}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </IconBase>
);

const IconSearch = (props) => (
  <IconBase {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
);

const IconList = (props) => (
  <IconBase {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="7" y1="9" x2="17" y2="9" />
    <line x1="7" y1="13" x2="17" y2="13" />
    <line x1="7" y1="17" x2="13" y2="17" />
  </IconBase>
);

const IconChevronRight = (props) => (
  <IconBase {...props}>
    <polyline points="9 18 15 12 9 6" />
  </IconBase>
);

const IconReceipt = (props) => (
  <IconBase {...props}>
    <path d="M6 2h12a1 1 0 0 1 1 1v18l-3-2-3 2-3-2-3 2-3-2V3a1 1 0 0 1 1-1z" />
    <line x1="9" y1="7" x2="15" y2="7" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </IconBase>
);

const IconCheck = (props) => (
  <IconBase {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);

const IconClose = (props) => (
  <IconBase {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconBase>
);

const IconPdf = (props) => (
  <IconBase {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </IconBase>
);

const IconCode = (props) => (
  <IconBase {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </IconBase>
);

const IconCamera = (props) => (
  <IconBase {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </IconBase>
);

function AdminValidaciones() {
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [facturas, setFacturas] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [tabActiva, setTabActiva] = useState("pdf");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargarFacturas = async () => {
      setCargandoLista(true);
      setError("");
      try {
        const { data } = await api.get("/validaciones/pendientes", {
          params: busqueda ? { q: busqueda } : {},
        });
        setFacturas(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(obtenerMensajeErrorApi ? obtenerMensajeErrorApi(err) : "No se pudieron cargar las facturas pendientes.");
        setFacturas([]);
      } finally {
        setCargandoLista(false);
      }
    };

    const timeoutId = setTimeout(cargarFacturas, 300);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const seleccionarFactura = async (factura) => {
    setCargandoDetalle(true);
    setTabActiva("pdf");
    try {
      const { data } = await api.get(`/validaciones/${factura.id}`);
      setFacturaSeleccionada(data || factura);
    } catch (err) {
      setFacturaSeleccionada(factura);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const manejarDecision = async (decision) => {
    if (!facturaSeleccionada) return;
    setProcesando(true);
    try {
      await api.post(`/validaciones/${facturaSeleccionada.id}/decision`, { decision });
      setFacturas((prev) => prev.filter((f) => f.id !== facturaSeleccionada.id));
      setFacturaSeleccionada(null);
    } catch (err) {
      setError(obtenerMensajeErrorApi ? obtenerMensajeErrorApi(err) : "No se pudo registrar la decisión.");
    } finally {
      setProcesando(false);
    }
  };

  const formatearMoneda = (monto) =>
    new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(monto || 0));

  const obtenerClaseBadge = (deduccion) => {
    if (!deduccion) return "aval-badge-deduccion--neutro";
    const texto = deduccion.toLowerCase();
    if (texto.includes("blupster")) return "aval-badge-deduccion--blupster";
    if (texto.includes("usuario")) return "aval-badge-deduccion--usuario";
    return "aval-badge-deduccion--neutro";
  };

  return (
    <div className="panel-container">
      <aside className="panel-sidebar">
        <div className="sidebar-top-wrapper">
          <button className="hamburger-btn" onClick={() => setMenuAbierto(!menuAbierto)}>
            <IconMenu />
          </button>
          <div className="sidebar-main-icon"></div>
          <div className="sidebar-header-text">
            <h2>Sistema de Control de Facturas</h2>
          </div>
        </div>

        <nav className={`sidebar-menu ${menuAbierto ? "show" : ""}`}>
          <button className="menu-item" onClick={() => navigate("/admin/facturas")}>
            <div className="menu-icon aval-facturas"></div>
            Facturas
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon aval-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon aval-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon aval-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon aval-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/usuarios")}>
            <div className="menu-icon aval-usuarios"></div>
            Usuarios
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon aval-perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout" onClick={() => navigate("/login")}>
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <div className="main-wrapper">
        <div className="top-blue-bar aval-topbar">
          <div className="aval-buscador">
            <IconSearch className="aval-buscador-icono" />
            <input
              type="text"
              placeholder="Buscar por reporte"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <main className="panel-main">
          {error && <div className="aval-alerta aval-alerta--error">{error}</div>}

          <div className="aval-layout">
            <div className="aval-lista-card">
              <h2 className="aval-lista-titulo">
                <IconList /> Facturas Pendientes
              </h2>

              <div className="aval-lista-scroll">
                {cargandoLista && <div className="aval-lista-estado">Cargando facturas...</div>}

                {!cargandoLista && facturas.length === 0 && (
                  <div className="aval-lista-estado">No hay facturas pendientes por validar.</div>
                )}

                {!cargandoLista &&
                  facturas.map((factura) => (
                    <button
                      key={factura.id}
                      className={`aval-item ${facturaSeleccionada?.id === factura.id ? "aval-item--activo" : ""}`}
                      onClick={() => seleccionarFactura(factura)}
                    >
                      <div className="aval-item-encabezado">
                        <span className="aval-item-folio">{factura.folio}</span>
                        <span className={`aval-badge-deduccion ${obtenerClaseBadge(factura.deduccion)}`}>
                          {factura.deduccion}
                        </span>
                      </div>
                      <span className="aval-item-razon">{factura.razonSocial}</span>
                      <span className="aval-item-rfc">RFC: {factura.rfc}</span>
                      <div className="aval-item-pie">
                        <span className="aval-item-monto">
                          ${formatearMoneda(factura.monto)} {factura.moneda || "MXN"}
                        </span>
                        <IconChevronRight className="aval-item-flecha" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="aval-detalle-card">
              {!facturaSeleccionada && !cargandoDetalle && (
                <div className="aval-detalle-vacio">
                  <IconReceipt size="2rem" />
                  Selecciona una factura de la lista para ver su detalle.
                </div>
              )}

              {cargandoDetalle && <div className="aval-detalle-vacio">Cargando detalle...</div>}

              {facturaSeleccionada && !cargandoDetalle && (
                <>
                  <div className="aval-detalle-header">
                    <div>
                      <h3 className="aval-detalle-titulo">Validación de Comprobante</h3>
                      <div className="aval-detalle-meta">
                        <span>
                          ID Transacción: <strong>{facturaSeleccionada.idTransaccion}</strong>
                        </span>
                        <span>
                          Fecha de Carga: <strong>{facturaSeleccionada.fechaCarga}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="aval-detalle-acciones">
                      <button
                        className="aval-btn-decision aval-btn-decision--deducible"
                        onClick={() => manejarDecision("deducible")}
                        disabled={procesando}
                      >
                        <IconCheck /> Deducible
                      </button>
                      <button
                        className="aval-btn-decision aval-btn-decision--no-deducible"
                        onClick={() => manejarDecision("no_deducible")}
                        disabled={procesando}
                      >
                        <IconClose /> No Deducible
                      </button>
                    </div>
                  </div>

                  <div className="aval-detalle-grid">
                    <div className="aval-datos-card">
                      <h4 className="aval-datos-titulo">Datos Fiscales Extraídos</h4>

                      <div className="aval-datos-grid">
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">RFC Emisor</span>
                          <span className="aval-dato-valor">{facturaSeleccionada.rfcEmisor}</span>
                        </div>
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">Nombre Emisor</span>
                          <span className="aval-dato-valor">{facturaSeleccionada.nombreEmisor}</span>
                        </div>
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">Uso CFDI</span>
                          <span className="aval-dato-valor">{facturaSeleccionada.usoCfdi}</span>
                        </div>
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">Método Pago</span>
                          <span className="aval-dato-valor">{facturaSeleccionada.metodoPago}</span>
                        </div>
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">Subtotal</span>
                          <span className="aval-dato-valor">${formatearMoneda(facturaSeleccionada.subtotal)}</span>
                        </div>
                        <div className="aval-dato">
                          <span className="aval-dato-etiqueta">IVA (16%)</span>
                          <span className="aval-dato-valor aval-dato-valor--iva">
                            ${formatearMoneda(facturaSeleccionada.iva)}
                          </span>
                        </div>
                      </div>

                      <div className="aval-total-box">
                        <span className="aval-total-etiqueta">Total a Validar</span>
                        <span className="aval-total-monto">
                          ${formatearMoneda(facturaSeleccionada.total)}
                          <span className="aval-total-moneda">{facturaSeleccionada.moneda || "MXN"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="aval-visor-card">
                      <div className="aval-visor-tabs">
                        <button
                          className={`aval-tab ${tabActiva === "pdf" ? "aval-tab--activo" : ""}`}
                          onClick={() => setTabActiva("pdf")}
                        >
                          <IconPdf /> PDF Preview
                        </button>
                        <button
                          className={`aval-tab ${tabActiva === "xml" ? "aval-tab--activo" : ""}`}
                          onClick={() => setTabActiva("xml")}
                        >
                          <IconCode /> XML Source
                        </button>
                        {facturaSeleccionada.fotoUrl && (
                          <button
                            className={`aval-tab ${tabActiva === "foto" ? "aval-tab--activo" : ""}`}
                            onClick={() => setTabActiva("foto")}
                          >
                            <IconCamera /> Fotografía
                          </button>
                        )}
                      </div>

                      <div className="aval-visor-contenido">
                        {tabActiva === "pdf" &&
                          (facturaSeleccionada.pdfUrl ? (
                            <iframe
                              src={facturaSeleccionada.pdfUrl}
                              title="Vista previa PDF"
                              className="aval-visor-iframe"
                            />
                          ) : (
                            <div className="aval-visor-vacio">Este comprobante no tiene PDF disponible.</div>
                          ))}

                        {tabActiva === "xml" &&
                          (facturaSeleccionada.xml ? (
                            <pre className="aval-visor-xml">{facturaSeleccionada.xml}</pre>
                          ) : (
                            <div className="aval-visor-vacio">Este comprobante no tiene XML disponible.</div>
                          ))}

                        {tabActiva === "foto" &&
                          (facturaSeleccionada.fotoUrl ? (
                            <img
                              src={facturaSeleccionada.fotoUrl}
                              alt="Fotografía del comprobante"
                              className="aval-visor-imagen"
                            />
                          ) : (
                            <div className="aval-visor-vacio">
                              Este comprobante no tiene fotografía adjunta.
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminValidaciones;