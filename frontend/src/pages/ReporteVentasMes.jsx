import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReporteVentasMes.css";
import React, { useState, useEffect, useRef } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const RFC_EXTRANJERO_GENERICO = "XEXX010101000";

const REGISTROS_POR_PAGINA = 5; // 👈 NUEVO

// 👇 NUEVO — genera la lista de números de página con "…" si son muchas
const generarPaginas = (totalPaginas, paginaActual) => {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }
  const paginas = new Set([1, 2, totalPaginas - 1, totalPaginas, paginaActual, paginaActual - 1, paginaActual + 1]);
  const lista = [...paginas].filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b);

  const resultado = [];
  let anterior = null;
  for (const p of lista) {
    if (anterior !== null && p - anterior > 1) resultado.push("…");
    resultado.push(p);
    anterior = p;
  }
  return resultado;
};



export default function ReporteVentasMes() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate("/login");
  };

  // ---------- Formulario ----------
  const [fecha, setFecha] = useState("");
  const [ingresosTotales, setIngresosTotales] = useState("");
  const [origen, setOrigen] = useState("NACIONAL");
  const [rfc, setRfc] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [iva, setIva] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [archivoXml, setArchivoXml] = useState(null);
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const inputXmlRef = useRef(null);
  const inputPdfRef = useRef(null);

  // Si cambia a "Extranjero" y el RFC está vacío, sugerimos el genérico
  const manejarCambioOrigen = (valor) => {
    setOrigen(valor);
    if (valor === "EXTRANJERO" && !rfc) {
      setRfc(RFC_EXTRANJERO_GENERICO);
    }
    if (valor === "NACIONAL" && rfc === RFC_EXTRANJERO_GENERICO) {
      setRfc("");
    }
  };

  const limpiarFormulario = () => {
    setFecha("");
    setIngresosTotales("");
    setOrigen("NACIONAL");
    setRfc("");
    setSubtotal("");
    setIva("");
    setMontoTotal("");
    setArchivoXml(null);
    setArchivoPdf(null);
    if (inputXmlRef.current) inputXmlRef.current.value = "";
    if (inputPdfRef.current) inputPdfRef.current.value = "";
  };

  const handleGuardar = async () => {
    if (!fecha || !ingresosTotales || !rfc || !subtotal || !iva || !montoTotal) {
      addToast("Completa todos los campos obligatorios.", "error");
      return;
    }
    if (!archivoXml || !archivoPdf) {
      addToast("Debes adjuntar el archivo XML y el PDF.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("fecha", fecha);
    formData.append("ingresosTotales", ingresosTotales);
    formData.append("origen", origen);
    formData.append("rfc", rfc);
    formData.append("subtotal", subtotal);
    formData.append("iva", iva);
    formData.append("montoTotal", montoTotal);
    formData.append("xml", archivoXml);
    formData.append("pdf", archivoPdf);

    try {
      setGuardando(true);
      await api.post("/ventas-mensuales/subir", formData);
      addToast("Reporte de ventas guardado correctamente.", "success");
      limpiarFormulario();
      cargarVentas();
    } catch (err) {
      addToast(obtenerMensajeErrorApi(err), "error");
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Tabla ----------
  const [filtro, setFiltro] = useState("este-mes");
  const [ventas, setVentas] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [cargandoTabla, setCargandoTabla] = useState(true);
  const [errorTabla, setErrorTabla] = useState("");
  const [paginaActual, setPaginaActual] = useState(1); // 👈 NUEVO

  const cargarVentas = async () => {
    setCargandoTabla(true);
    setErrorTabla("");
    try {
      const { data } = await api.get("/ventas-mensuales/listar", {
        params: { filtro, pagina: paginaActual, porPagina: REGISTROS_POR_PAGINA }, // 👈 cambiado
      });
      setVentas(Array.isArray(data?.ventas) ? data.ventas : []);
      setTotalRegistros(data?.total ?? 0);
    } catch (err) {
      setErrorTabla(obtenerMensajeErrorApi(err));
      setVentas([]);
    } finally {
      setCargandoTabla(false);
    }
  };

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, paginaActual]); // 👈 se agrega paginaActual

  return (
    <div className="panel-container">
      {/* ---------- Sidebar (administrador) ---------- */}
      <aside className="panel-sidebar">
        <div className="sidebar-top-wrapper">
          <button
            className="hamburger-btn"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú"
          >
            {menuAbierto ? "✕" : "☰"}
          </button>
          <div className="sidebar-main-icon"></div>
          <div className="sidebar-header-text">
            <h2>Sistema de Control de Facturas</h2>
          </div>
        </div>

        <nav className={`sidebar-menu ${menuAbierto ? "show" : ""}`}>
          <button className="menu-item" onClick={() => navigate("/admin/facturas")}>
            <div className="menu-icon rvm-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon rvm-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon rvm-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon rvm-icono-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon rvm-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon rvm-icono-reporte-ventas"></div>
            Reporte de Ventas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon rvm-icono-perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar rvm-topbar">
          <h1 className="rvm-topbar-titulo">Carga Manual de Reporte de Ventas</h1>
        </div>

        <main className="panel-main">
          {/* ---------- Formulario ---------- */}
          <section className="rvm-card">
            <div className="rvm-card-header">
              <h2>Carga manual de reporte de ventas del mes</h2>
              <span className="rvm-card-subtitulo">Registro de ingresos y desglose fiscal</span>
            </div>

            <div className="rvm-card-body">
              <div className="rvm-campos-grid">
                <div className="rvm-campo">
                  <label>Fecha <span className="rvm-requerido">*</span></label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="rvm-campo">
                  <label>Ingresos Totales <span className="rvm-requerido">*</span></label>
                  <div className="rvm-input-moneda">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={ingresosTotales}
                      onChange={(e) => setIngresosTotales(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rvm-campos-grid">
                <div className="rvm-campo">
                  <label>Nacional o Extranjero <span className="rvm-requerido">*</span></label>
                  <select value={origen} onChange={(e) => manejarCambioOrigen(e.target.value)}>
                    <option value="NACIONAL">Nacional</option>
                    <option value="EXTRANJERO">Extranjero</option>
                  </select>
                </div>
                <div className="rvm-campo">
                  <label>RFC <span className="rvm-requerido">*</span></label>
                  <input
                    type="text"
                    placeholder={origen === "EXTRANJERO" ? RFC_EXTRANJERO_GENERICO : "ABCD123456XY"}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    maxLength={13}
                  />
                </div>
              </div>

              <hr className="rvm-separador" />

              <div className="rvm-campos-grid rvm-campos-grid--tres">
                <div className="rvm-campo">
                  <label>Subtotal <span className="rvm-requerido">*</span></label>
                  <div className="rvm-input-moneda">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={subtotal}
                      onChange={(e) => setSubtotal(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rvm-campo">
                  <label>IVA <span className="rvm-requerido">*</span></label>
                  <div className="rvm-input-moneda">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={iva}
                      onChange={(e) => setIva(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rvm-campo">
                  <label>Monto Total <span className="rvm-requerido">*</span></label>
                  <div className="rvm-input-moneda">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rvm-uploads-grid">
                <div>
                  <div className={"rvm-upload-box" + (archivoXml ? " rvm-upload-box--con-archivo" : "")}>
                    <input
                      ref={inputXmlRef}
                      type="file"
                      accept=".xml"
                      className="rvm-upload-input"
                      onChange={(e) => setArchivoXml(e.target.files?.[0] || null)}
                    />
                    <span className="rvm-upload-icono">{"{ }"}</span>
                    <span className="rvm-upload-titulo">
                      Adjuntar XML <span className="rvm-requerido">*</span>
                    </span>
                    <span className="rvm-upload-subtitulo">
                      {archivoXml ? archivoXml.name : "Arrastre o seleccione el archivo"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className={"rvm-upload-box" + (archivoPdf ? " rvm-upload-box--con-archivo" : "")}>
                    <input
                      ref={inputPdfRef}
                      type="file"
                      accept=".pdf"
                      className="rvm-upload-input"
                      onChange={(e) => setArchivoPdf(e.target.files?.[0] || null)}
                    />
                    <span className="rvm-upload-icono">▤</span>
                    <span className="rvm-upload-titulo">
                      Adjuntar PDF <span className="rvm-requerido">*</span>
                    </span>
                    <span className="rvm-upload-subtitulo">
                      {archivoPdf ? archivoPdf.name : "Arrastre o seleccione el archivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rvm-acciones">
                <button
                  type="button"
                  className="rvm-btn rvm-btn--secundario"
                  onClick={limpiarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="rvm-btn rvm-btn--primario"
                  onClick={handleGuardar}
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar reporte"}
                </button>
              </div>
            </div>
          </section>

          {/* ---------- Tabla ---------- */}
          <section className="rvm-tabla-section">
            <div className="rvm-tabla-header">
              <h2 className="rvm-tabla-titulo">Resumen de Cargas Recientes</h2>
              <div className="rvm-filtro-wrapper">
                <label>Filtrar por:</label>
                <select
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value);
                    setPaginaActual(1); // 👈 NUEVO
                  }}
                >
                  <option value="este-mes">Este mes</option>
                  <option value="mes-anterior">Mes anterior</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>

            {errorTabla && <div className="rvm-alerta rvm-alerta--error">{errorTabla}</div>}

            <div className="rvm-tabla-responsive">
              <table className="rvm-tabla">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>ORIGEN</th>
                    <th>RFC</th>
                    <th>INGRESOS TOTALES</th>
                    <th>SUBTOTAL</th>
                    <th>IVA</th>
                    <th>MONTO TOTAL</th>
                    <th>ARCHIVOS</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoTabla && (
                    <tr>
                      <td colSpan={8} className="rvm-sin-resultados">Cargando...</td>
                    </tr>
                  )}

                  {!cargandoTabla && ventas.length === 0 && (
                    <tr>
                      <td colSpan={8} className="rvm-sin-resultados">No hay cargas registradas.</td>
                    </tr>
                  )}

                  {!cargandoTabla &&
                    ventas.map((v) => (
                      <tr key={v.id}>
                        <td className="rvm-texto-gris">{formatoFecha(v.fecha)}</td>
                        <td>
                          <span
                            className={`rvm-badge-origen ${
                              v.origen === "EXTRANJERO" ? "rvm-badge-origen--extranjero" : "rvm-badge-origen--nacional"
                            }`}
                          >
                            {v.origen === "EXTRANJERO" ? "EXTRANJERO" : "NACIONAL"}
                          </span>
                        </td>
                        <td className="rvm-texto-gris">{v.rfc}</td>
                        <td className="rvm-celda-fuerte">{formatoMoneda(v.ingresosTotales)}</td>
                        <td className="rvm-texto-gris">{formatoMoneda(v.subtotal)}</td>
                        <td className="rvm-texto-gris">{formatoMoneda(v.iva)}</td>
                        <td className="rvm-celda-total">{formatoMoneda(v.montoTotal)}</td>
                        <td>
                          <div className="rvm-archivos-links">
                            <a href={v.xmlUrl} target="_blank" rel="noopener noreferrer" title="Ver XML">
                              {"<>"}
                            </a>
                            <a href={v.pdfUrl} target="_blank" rel="noopener noreferrer" title="Ver PDF">
                              ▤
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* 👇 NUEVO — controles de paginación */}
            {totalRegistros > 0 && (
              <div className="rvm-paginacion">
                <span className="rvm-paginacion-resumen">
                  Mostrando {(paginaActual - 1) * REGISTROS_POR_PAGINA + 1}
                  {" - "}
                  {Math.min(paginaActual * REGISTROS_POR_PAGINA, totalRegistros)} de {totalRegistros} registros
                </span>

                <div className="rvm-paginacion-controles">
                  <button
                    className="rvm-paginacion-flecha"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>

                  {generarPaginas(Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)), paginaActual).map(
                    (p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="rvm-paginacion-puntos">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          className={`rvm-paginacion-numero ${p === paginaActual ? "rvm-paginacion-numero--activo" : ""}`}
                          onClick={() => setPaginaActual(p)}
                        >
                          {p}
                        </button>
                      )
                  )}

                  <button
                    className="rvm-paginacion-flecha"
                    onClick={() =>
                      setPaginaActual((p) =>
                        Math.min(p + 1, Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)))
                      )
                    }
                    disabled={paginaActual >= Math.ceil(totalRegistros / REGISTROS_POR_PAGINA)}
                    aria-label="Página siguiente"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          
          </section>
        </main>
      </div>

      <ModalCerrarSesion
        isOpen={modalCerrarSesionAbierto}
        onClose={() => setModalCerrarSesionAbierto(false)}
        onConfirm={handleCerrarSesion}
      />
    </div>
  );
}