import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReportesGlobales.css";
import React, { useState, useEffect } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";
import html2pdf from "html2pdf.js";

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const REGISTROS_POR_PAGINA = 5;

export default function ReportesGlobales() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState("diot"); // diot | pendientes | contabilidad

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate("/login");
  };

  // ---------- Catálogos compartidos ----------
  const [tiposGasto, setTiposGasto] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const { data } = await api.get("/facturas/catalogos/tipos-gasto");
        if (Array.isArray(data)) setTiposGasto(data);
      } catch (err) {
        console.warn("No se pudo cargar el catálogo de tipos de gasto.", err);
      }
      try {
        const { data } = await api.get("/usuarios");
        if (Array.isArray(data)) setUsuarios(data.filter((u) => u.rol === "USUARIO"));
      } catch (err) {
        console.warn("No se pudo cargar el catálogo de usuarios.", err);
      }
    };
    cargarCatalogos();
  }, []);

  // =========================================================================
  // TAB: Reporte DIOT
  // =========================================================================
  const [diotRfc, setDiotRfc] = useState("");
  const [diotTipoGasto, setDiotTipoGasto] = useState("");
  const [diotEstado, setDiotEstado] = useState("");
  const [diotGrupos, setDiotGrupos] = useState([]);
  const [diotGranTotal, setDiotGranTotal] = useState(0);
  const [cargandoDiot, setCargandoDiot] = useState(false);
  const [errorDiot, setErrorDiot] = useState("");

  const cargarDiot = async () => {
    setCargandoDiot(true);
    setErrorDiot("");
    try {
      const { data } = await api.get("/reportes-globales/diot", {
        params: {
          rfc: diotRfc || undefined,
          tipoGasto: diotTipoGasto || undefined,
          estado: diotEstado || undefined,
        },
      });
      setDiotGrupos(Array.isArray(data?.grupos) ? data.grupos : []);
      setDiotGranTotal(data?.granTotal ?? 0);
    } catch (err) {
      setErrorDiot(obtenerMensajeErrorApi(err));
      setDiotGrupos([]);
      setDiotGranTotal(0);
    } finally {
      setCargandoDiot(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "diot") cargarDiot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva]);

  const exportarDiotCsv = (tipo) => {
    // tipo: "empresa" | "usuario"
    const filas = [["RFC", "Razón Social", "Facturas", "Tipo de Gasto", "Descripción", "Estado", "IVA", "Total Acumulado"]];
    diotGrupos.forEach((g) => {
      const sub = g[tipo];
      if (!sub) return;
      filas.push([g.rfc, g.razonSocial, sub.facturas, sub.tipoGasto, sub.descripcion, sub.estado, sub.iva, sub.total]);
    });
    if (filas.length === 1) {
      addToast(`No hay registros de ${tipo === "empresa" ? "Empresa" : "Usuario"} para exportar.`, "warning");
      return;
    }
    const csv = filas.map((f) => f.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diot-${tipo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // TAB: Facturas a Solicitar / Recibos a Emitir
  // =========================================================================
  const [penUsuarioId, setPenUsuarioId] = useState("");
  const [penTipoGasto, setPenTipoGasto] = useState("");
  const [penEstado, setPenEstado] = useState("");
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [errorPendientes, setErrorPendientes] = useState("");
  const [paginaPendientes, setPaginaPendientes] = useState(1);
  const [exportandoPdfPendientes, setExportandoPdfPendientes] = useState(false);

  const cargarPendientes = async () => {
    setCargandoPendientes(true);
    setErrorPendientes("");
    try {
      const { data } = await api.get("/reportes-globales/pendientes", {
        params: {
          usuarioId: penUsuarioId || undefined,
          tipoGasto: penTipoGasto || undefined,
          estado: penEstado || undefined,
        },
      });
      setPendientes(Array.isArray(data?.pendientes) ? data.pendientes : []);
      setPaginaPendientes(1);
    } catch (err) {
      setErrorPendientes(obtenerMensajeErrorApi(err));
      setPendientes([]);
    } finally {
      setCargandoPendientes(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "pendientes") cargarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva]);

  const totalPaginasPendientes = Math.max(1, Math.ceil(pendientes.length / REGISTROS_POR_PAGINA));
  const inicioPag = (paginaPendientes - 1) * REGISTROS_POR_PAGINA;
  const pendientesPagina = pendientes.slice(inicioPag, inicioPag + REGISTROS_POR_PAGINA);

  const handleSolicitarFactura = async (id) => {
    try {
      await api.post(`/reportes-globales/solicitar-factura/${id}`);
      addToast("Solicitud de factura enviada.", "success");
    } catch (err) {
      addToast(obtenerMensajeErrorApi(err), "error");
    }
  };

  const handleEmitirRecibo = async (id) => {
    try {
      await api.post(`/reportes-globales/emitir-recibo/${id}`);
      addToast("Solicitud de recibo enviada.", "success");
    } catch (err) {
      addToast(obtenerMensajeErrorApi(err), "error");
    }
  };

  // ---------- Exportar CSV: separado en dos tablas (Facturas a Solicitar / Recibos a Emitir) ----------
  const exportarPendientesCsv = () => {
    if (pendientes.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }

    const facturasASolicitar = pendientes.filter((p) => p.requiereFactura);
    const recibosAEmitir = pendientes.filter((p) => p.requiereRecibo);

    const encabezado = ["Usuario", "Concepto", "Tipo de Gasto", "Fecha", "Monto", "Estado"];
    const filas = [];

    filas.push(["FACTURAS A SOLICITAR"]);
    filas.push(encabezado);
    if (facturasASolicitar.length === 0) {
      filas.push(["Sin registros."]);
    } else {
      facturasASolicitar.forEach((p) => {
        filas.push([p.usuario, p.concepto, p.tipoGasto, formatoFecha(p.fecha), p.monto, p.estado]);
      });
    }

    filas.push([]);
    filas.push(["RECIBOS A EMITIR"]);
    filas.push(encabezado);
    if (recibosAEmitir.length === 0) {
      filas.push(["Sin registros."]);
    } else {
      recibosAEmitir.forEach((p) => {
        filas.push([p.usuario, p.concepto, p.tipoGasto, formatoFecha(p.fecha), p.monto, p.estado]);
      });
    }

    const csv = filas.map((f) => f.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "facturas-solicitar-recibos-emitir.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Exportar PDF: separado en dos tablas, y con el fix del bug de PDF en blanco ----------
  const exportarPendientesPdf = async () => {
    if (pendientes.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }
    setExportandoPdfPendientes(true);

    const facturasASolicitar = pendientes.filter((p) => p.requiereFactura);
    const recibosAEmitir = pendientes.filter((p) => p.requiereRecibo);

    const construirFilas = (lista) =>
      lista
        .map(
          (p) => `
          <tr>
            <td>${p.usuario}</td>
            <td>${p.concepto}</td>
            <td>${p.tipoGasto}</td>
            <td>${formatoFecha(p.fecha)}</td>
            <td>${formatoMoneda(p.monto)}</td>
            <td>${p.estado}</td>
          </tr>`
        )
        .join("");

    const construirTabla = (titulo, lista) => `
      <h2 style="font-size:15px;margin-top:24px;margin-bottom:8px;">${titulo}</h2>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Usuario</th>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Concepto</th>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Tipo de Gasto</th>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Fecha</th>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Monto</th>
            <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${construirFilas(lista) || `<tr><td colspan="6" style="padding:8px;font-size:12px;">Sin registros.</td></tr>`}
        </tbody>
      </table>
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1A2530; padding: 10px; background:#ffffff;">
        <h1 style="font-size: 18px; margin-bottom: 4px;">Facturas a Solicitar / Recibos a Emitir</h1>
        ${construirTabla("Facturas a Solicitar", facturasASolicitar)}
        ${construirTabla("Recibos a Emitir", recibosAEmitir)}
      </div>
    `;

    // 👇 FIX del bug de PDF en blanco: antes el contenedor se posicionaba en
    // "left: -9999px" (fuera de pantalla) y html2canvas lo capturaba en blanco.
    // Ahora se posiciona en coordenadas normales (0,0) pero se oculta detrás
    // de todo el contenido con z-index negativo, con fondo blanco y ancho fijo,
    // igual que se resolvió en el Reporte por Usuario.
    const contenedor = document.createElement("div");
    contenedor.style.position = "fixed";
    contenedor.style.top = "0";
    contenedor.style.left = "0";
    contenedor.style.zIndex = "-9999";
    contenedor.style.backgroundColor = "#ffffff";
    contenedor.style.width = "1400px";
    contenedor.innerHTML = html;
    document.body.appendChild(contenedor);

    // Esperar un breve instante para asegurar el maquetado en el DOM antes del renderizado
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: "facturas-solicitar-recibos-emitir.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(contenedor)
        .save();
      addToast("PDF generado correctamente.", "success");
    } catch (err) {
      console.error(err);
      addToast("No se pudo generar el PDF.", "error");
    } finally {
      // Retrasamos la remoción del contenedor para evitar que sea eliminado del DOM
      // mientras html2canvas/html2pdf aún se encuentra procesando la captura.
      setTimeout(() => {
        if (document.body.contains(contenedor)) {
          document.body.removeChild(contenedor);
        }
      }, 2000);
      setExportandoPdfPendientes(false);
    }
  };

  // =========================================================================
  // TAB: Contabilidad General (placeholder, aún sin definir)
  // =========================================================================
  const handleContabilidadProximamente = () => {
    addToast("Este reporte aún está en definición. Próximamente disponible.", "warning");
  };

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
            <div className="menu-icon rg-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon rg-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon rg-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon rg-icono-reportes-global"></div>
            Reportes Globales
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon rg-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon rg-icono-reporte-ventas"></div>
            Reporte de Ventas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon rg-icono-perfil"></div>
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
        <div className="top-blue-bar rg-topbar">
          <h1 className="rg-topbar-titulo">Reportes Globales</h1>
        </div>

        <main className="panel-main">
          {/* ---------- Submenú (pestañas) ---------- */}
          <div className="rg-tabs">
            <button
              className={`rg-tab ${tabActiva === "diot" ? "rg-tab--activo" : ""}`}
              onClick={() => setTabActiva("diot")}
            >
              Reporte DIOT
            </button>
            <button
              className={`rg-tab ${tabActiva === "pendientes" ? "rg-tab--activo" : ""}`}
              onClick={() => setTabActiva("pendientes")}
            >
              Facturas a solicitar / Recibos a emitir
            </button>
            <button
              className={`rg-tab ${tabActiva === "contabilidad" ? "rg-tab--activo" : ""}`}
              onClick={() => setTabActiva("contabilidad")}
            >
              Contabilidad General
            </button>
          </div>

          {/* ==================================================================
              TAB: Reporte DIOT
              ================================================================== */}
          {tabActiva === "diot" && (
            <section className="rg-panel">
              <div className="rg-panel-header">
                <div>
                  <span className="rg-breadcrumb">Reportes › Reporte DIOT – Empresa / Usuario</span>
                  <h2 className="rg-panel-titulo">Reporte DIOT – Empresa / Usuario</h2>
                </div>
                <div className="rg-panel-acciones">
                  <button className="rg-btn rg-btn--secundario" onClick={() => exportarDiotCsv("usuario")}>
                    Exportar DIOT Usuario
                  </button>
                  <button className="rg-btn rg-btn--primario" onClick={() => exportarDiotCsv("empresa")}>
                    Exportar DIOT Empresa
                  </button>
                </div>
              </div>

              <div className="rg-filtros">
                <div className="rg-filtro">
                  <label>RFC Receptor / Emisor</label>
                  <input
                    type="text"
                    placeholder="GACM880101ABC"
                    value={diotRfc}
                    onChange={(e) => setDiotRfc(e.target.value)}
                  />
                </div>
                <div className="rg-filtro">
                  <label>Tipo de Gasto</label>
                  <select value={diotTipoGasto} onChange={(e) => setDiotTipoGasto(e.target.value)}>
                    <option value="">Todos los Gastos</option>
                    {tiposGasto.map((t) => (
                      <option key={t.codigo} value={t.descripcion}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rg-filtro">
                  <label>Estado Fiscal</label>
                  <select value={diotEstado} onChange={(e) => setDiotEstado(e.target.value)}>
                    <option value="">Cualquier Estado</option>
                    <option value="FACTURADO">Vigente</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="NO FACTURADO">No Facturado</option>
                  </select>
                </div>
                <button className="rg-btn rg-btn--filtrar" onClick={cargarDiot}>
                  Aplicar Filtros
                </button>
              </div>

              {errorDiot && <div className="rg-alerta rg-alerta--error">{errorDiot}</div>}

              <div className="rg-tabla-responsive">
                <table className="rg-tabla">
                  <thead>
                    <tr>
                      <th>RFC / Origen</th>
                      <th>Razón Social</th>
                      <th>Facturas</th>
                      <th>Tipo de Gasto</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th className="rg-col-derecha">IVA</th>
                      <th className="rg-col-derecha">Total Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargandoDiot && (
                      <tr>
                        <td colSpan={8} className="rg-sin-resultados">Cargando...</td>
                      </tr>
                    )}

                    {!cargandoDiot && diotGrupos.length === 0 && (
                      <tr>
                        <td colSpan={8} className="rg-sin-resultados">No se encontraron registros.</td>
                      </tr>
                    )}

                    {!cargandoDiot &&
                      diotGrupos.map((g) => (
                        <React.Fragment key={g.rfc}>
                          <tr className="rg-fila-grupo">
                            <td colSpan={7}>{g.rfc} — {g.razonSocial}</td>
                            <td className="rg-col-derecha">{formatoMoneda(g.totalGrupo)}</td>
                          </tr>

                          <tr>
                            <td className="rg-texto-gris">Empresa</td>
                            <td>{g.empresa ? g.razonSocial : "—"}</td>
                            <td>{g.empresa ? g.empresa.facturas : 0}</td>
                            <td>
                              {g.empresa ? (
                                <span className="rg-badge-tipo">{g.empresa.tipoGasto}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="rg-texto-gris">{g.empresa ? (g.empresa.descripcion || "—") : "—"}</td>
                            <td>
                              {g.empresa ? (
                                <span className={`rg-badge-estado rg-badge-estado--${g.empresa.estado.toLowerCase().replace(" ", "-")}`}>
                                  {g.empresa.estado}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="rg-col-derecha">
                              {g.empresa ? formatoMoneda(g.empresa.iva) : formatoMoneda(0)}
                            </td>
                            <td className="rg-col-derecha">
                              {g.empresa ? formatoMoneda(g.empresa.total) : formatoMoneda(0)}
                            </td>
                          </tr>

                          <tr>
                            <td className="rg-texto-gris">Usuario</td>
                            <td>{g.usuario ? g.razonSocial : "—"}</td>
                            <td>{g.usuario ? g.usuario.facturas : 0}</td>
                            <td>
                              {g.usuario ? <span className="rg-badge-tipo">{g.usuario.tipoGasto}</span> : "—"}
                            </td>
                            <td className="rg-texto-gris">{g.usuario ? (g.usuario.descripcion || "—") : "—"}</td>
                            <td>
                              {g.usuario ? (
                                <span className={`rg-badge-estado rg-badge-estado--${g.usuario.estado.toLowerCase().replace(" ", "-")}`}>
                                  {g.usuario.estado}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="rg-col-derecha">
                              {g.usuario ? formatoMoneda(g.usuario.iva) : formatoMoneda(0)}
                            </td>
                            <td className="rg-col-derecha">
                              {g.usuario ? formatoMoneda(g.usuario.total) : formatoMoneda(0)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                  </tbody>

                  {!cargandoDiot && diotGrupos.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={7} className="rg-pie-etiqueta">
                          Gran Total Reporte
                        </td>
                        <td className="rg-pie-total rg-col-derecha">{formatoMoneda(diotGranTotal)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>
          )}

          {/* ==================================================================
              TAB: Facturas a Solicitar / Recibos a Emitir
              ================================================================== */}
          {tabActiva === "pendientes" && (
            <section className="rg-panel">
              <div className="rg-panel-header">
                <div>
                  <span className="rg-breadcrumb">Control Fiscal › Gestión de Comprobantes</span>
                  <h2 className="rg-panel-titulo">Facturas a Solicitar / Recibos a Emitir</h2>
                </div>
                <div className="rg-panel-acciones">
                  <button className="rg-btn rg-btn--secundario" onClick={exportarPendientesCsv}>
                    Exportar CSV
                  </button>
                  <button
                    className="rg-btn rg-btn--primario"
                    onClick={exportarPendientesPdf}
                    disabled={exportandoPdfPendientes}
                  >
                    {exportandoPdfPendientes ? "Generando..." : "Exportar PDF"}
                  </button>
                </div>
              </div>

              <div className="rg-filtros">
                <div className="rg-filtro">
                  <label>Usuario</label>
                  <select value={penUsuarioId} onChange={(e) => setPenUsuarioId(e.target.value)}>
                    <option value="">Todos los Usuarios</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellidoPaterno}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rg-filtro">
                  <label>Tipo de Gasto</label>
                  <select value={penTipoGasto} onChange={(e) => setPenTipoGasto(e.target.value)}>
                    <option value="">Cualquier Categoría</option>
                    {tiposGasto.map((t) => (
                      <option key={t.codigo} value={t.descripcion}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rg-filtro">
                  <label>Estado</label>
                  <select value={penEstado} onChange={(e) => setPenEstado(e.target.value)}>
                    <option value="">Todos los Estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="FACTURADO">Facturado</option>
                    <option value="NO FACTURADO">No Facturado</option>
                  </select>
                </div>
                <button className="rg-btn rg-btn--filtrar" onClick={cargarPendientes}>
                  Aplicar Filtros
                </button>
              </div>

              {errorPendientes && <div className="rg-alerta rg-alerta--error">{errorPendientes}</div>}

              <div className="rg-tabla-responsive">
                <table className="rg-tabla">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Concepto</th>
                      <th>Tipo de Gasto</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Acción Requerida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargandoPendientes && (
                      <tr>
                        <td colSpan={7} className="rg-sin-resultados">Cargando...</td>
                      </tr>
                    )}

                    {!cargandoPendientes && pendientesPagina.length === 0 && (
                      <tr>
                        <td colSpan={7} className="rg-sin-resultados">No se encontraron registros.</td>
                      </tr>
                    )}

                    {!cargandoPendientes &&
                      pendientesPagina.map((p) => (
                        <tr key={p.id}>
                          <td className="rg-celda-usuario">{p.usuario}</td>
                          <td>{p.concepto}</td>
                          <td>
                            <span className="rg-badge-tipo">{p.tipoGasto}</span>
                          </td>
                          <td className="rg-texto-gris">{formatoFecha(p.fecha)}</td>
                          <td className="rg-col-derecha">{formatoMoneda(p.monto)}</td>
                          <td>
                            <span className={`rg-badge-estado rg-badge-estado--${p.estado.toLowerCase().replace(" ", "-")}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td>
                            <div className="rg-acciones-fila">
                              <button
                                className="rg-btn-accion rg-btn-accion--solicitar"
                                disabled={!p.requiereFactura}
                                onClick={() => handleSolicitarFactura(p.id)}
                              >
                                Solicitar Factura
                              </button>
                              <button
                                className="rg-btn-accion rg-btn-accion--emitir"
                                disabled={!p.requiereRecibo}
                                onClick={() => handleEmitirRecibo(p.id)}
                              >
                                Emitir Recibo
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {!cargandoPendientes && pendientes.length > 0 && (
                <div className="rg-paginacion">
                  <span className="rg-paginacion-resumen">
                    Mostrando {inicioPag + 1} - {Math.min(inicioPag + REGISTROS_POR_PAGINA, pendientes.length)} de{" "}
                    {pendientes.length} registros
                  </span>
                  <div className="rg-paginacion-controles">
                    <button
                      className="rg-paginacion-flecha"
                      onClick={() => setPaginaPendientes((p) => Math.max(p - 1, 1))}
                      disabled={paginaPendientes === 1}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPaginasPendientes }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        className={`rg-paginacion-numero ${n === paginaPendientes ? "rg-paginacion-numero--activo" : ""}`}
                        onClick={() => setPaginaPendientes(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className="rg-paginacion-flecha"
                      onClick={() => setPaginaPendientes((p) => Math.min(p + 1, totalPaginasPendientes))}
                      disabled={paginaPendientes === totalPaginasPendientes}
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ==================================================================
              TAB: Contabilidad General (placeholder)
              ================================================================== */}
          {tabActiva === "contabilidad" && (
            <section className="rg-panel rg-panel--vacio">
              <div className="rg-panel-header rg-panel-header--simple">
                <h2 className="rg-panel-titulo">Contabilidad General – Cierre Mensual</h2>
                <div className="rg-panel-acciones">
                  <button className="rg-btn rg-btn--primario" onClick={handleContabilidadProximamente}>
                    Exportar PDF
                  </button>
                  <button className="rg-btn rg-btn--primario" onClick={handleContabilidadProximamente}>
                    Exportar CSV
                  </button>
                </div>
              </div>
              <div className="rg-contabilidad-vacio">
                REPORTE PENDIENTE
              </div>
            </section>
          )}
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