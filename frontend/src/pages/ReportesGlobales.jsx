import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReportesGlobales.css";
import React, { useState, useEffect } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const etiquetaTipoContable = (tipo) => {
  if (tipo === "Ingreso") return "Ingreso";
  if (tipo === "Egreso-Empresa") return "Egreso (Empresa)";
  if (tipo === "Egreso-Reembolso") return "Egreso (Reembolso)";
  return tipo;
};

const claseTipoContable = (tipo) => {
  if (tipo === "Ingreso") return "rg-badge-contable--ingreso";
  if (tipo === "Egreso-Empresa") return "rg-badge-contable--egreso-empresa";
  return "rg-badge-contable--egreso-reembolso";
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
    const filas = [["RFC", "Razón Social", "Facturas", "Tipo de Gasto", "Estado", "Total Acumulado"]];
    diotGrupos.forEach((g) => {
      const sub = g[tipo];
      if (!sub) return;
      filas.push([g.rfc, g.razonSocial, sub.facturas, sub.tipoGasto, sub.estado, sub.total]);
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

  const exportarPendientesCsv = () => {
    if (pendientes.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }
    const filas = [["Usuario", "Concepto", "Tipo de Gasto", "Fecha", "Monto", "Estado", "Requiere Factura", "Requiere Recibo"]];
    pendientes.forEach((p) => {
      filas.push([
        p.usuario,
        p.concepto,
        p.tipoGasto,
        formatoFecha(p.fecha),
        p.monto,
        p.estado,
        p.requiereFactura ? "Sí" : "No",
        p.requiereRecibo ? "Sí" : "No",
      ]);
    });
    const csv = filas.map((f) => f.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "facturas-solicitar-recibos-emitir.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarPendientesPdf = () => {
    if (pendientes.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }
    setExportandoPdfPendientes(true);

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFontSize(14);
      doc.setTextColor(26, 37, 48);
      doc.text("Facturas a Solicitar / Recibos a Emitir", 14, 15);

      autoTable(doc, {
        startY: 20,
        head: [["Usuario", "Concepto", "Tipo de Gasto", "Fecha", "Monto", "Estado", "Solicitar Factura", "Emitir Recibo"]],
        body: pendientes.map((p) => [
          p.usuario,
          p.concepto,
          p.tipoGasto,
          formatoFecha(p.fecha),
          formatoMoneda(p.monto),
          p.estado,
          p.requiereFactura ? "Sí" : "No",
          p.requiereRecibo ? "Sí" : "No",
        ]),
        headStyles: { fillColor: [0, 89, 179], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        styles: { cellPadding: 2 },
      });

      doc.save("facturas-solicitar-recibos-emitir.pdf");
      addToast("PDF generado correctamente.", "success");
    } catch (err) {
      console.error(err);
      addToast("No se pudo generar el PDF.", "error");
    } finally {
      setExportandoPdfPendientes(false);
    }
  };

  // =========================================================================
  // TAB: Contabilidad General — reporte completo AQUÍ MISMO, sin navegar
  // =========================================================================
  const [contDesde, setContDesde] = useState("");
  const [contHasta, setContHasta] = useState("");
  const [reporteContable, setReporteContable] = useState(null);
  const [cargandoContable, setCargandoContable] = useState(false);
  const [errorContable, setErrorContable] = useState("");
  const [exportandoPdfContable, setExportandoPdfContable] = useState(false);
  const [paginaContable, setPaginaContable] = useState(1);


 const cargarReporteContable = async () => {
    setCargandoContable(true);
    setErrorContable("");
    try {
      const { data } = await api.get("/reportes/contabilidad-general", {
        params: {
          desde: contDesde || undefined,
          hasta: contHasta || undefined,
        },
      });
      setReporteContable(data);
      setPaginaContable(1); // 👈 NUEVO — evita quedar "atorado" en una página que ya no existe
    } catch (err) {
      setErrorContable(obtenerMensajeErrorApi(err));
      setReporteContable(null);
    } finally {
      setCargandoContable(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "contabilidad") cargarReporteContable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActiva]);

  // 👇 NUEVO — paginación del detalle de Contabilidad General (mismo patrón que "pendientes")
  const detalleContable = reporteContable?.detalle ?? [];
  const totalPaginasContable = Math.max(1, Math.ceil(detalleContable.length / REGISTROS_POR_PAGINA));
  const inicioPagContable = (paginaContable - 1) * REGISTROS_POR_PAGINA;
  const detalleContablePagina = detalleContable.slice(inicioPagContable, inicioPagContable + REGISTROS_POR_PAGINA);



  const exportarContableCsv = () => {
    if (!reporteContable || reporteContable.detalle.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }

    const filas = [["Fecha", "RFC", "Razón Social", "Subtotal", "IVA", "Total", "Tipo"]];
    reporteContable.detalle.forEach((d) => {
      filas.push([
        formatoFecha(d.fecha),
        d.rfc,
        d.razonSocial,
        d.subtotal,
        d.iva,
        d.total,
        etiquetaTipoContable(d.tipo),
      ]);
    });

    filas.push([]);
    filas.push(["Total Ingresos", "", "", "", "", reporteContable.ingresos.total, ""]);
    filas.push(["Total Egresos", "", "", "", "", reporteContable.egresos.total, ""]);
    filas.push(["Resultado Contable", "", "", "", "", reporteContable.resultado, ""]);

    const csv = filas
      .map((f) => f.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-contable-general.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarContablePdf = () => {
    if (!reporteContable || reporteContable.detalle.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }
    setExportandoPdfContable(true);

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const fechaHoy = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc.setFontSize(16);
      doc.setTextColor(0, 89, 179);
      doc.text("Sistema de Control de Facturas", 14, 15);

      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reporte Contable General — Generado el ${fechaHoy}`, 14, 21);

      // ---------- Tarjetas de resumen ----------
      const boxY = 27, boxW = 85, boxH = 20, gap = 5;
      const boxes = [
        {
          x: 14,
          label: "TOTAL INGRESOS",
          value: formatoMoneda(reporteContable.ingresos.total),
          bg: [209, 250, 229],
          color: [5, 150, 105],
        },
        {
          x: 14 + boxW + gap,
          label: "TOTAL EGRESOS",
          value: formatoMoneda(reporteContable.egresos.total),
          bg: [254, 226, 226],
          color: [220, 38, 38],
        },
        {
          x: 14 + (boxW + gap) * 2,
          label: "RESULTADO CONTABLE",
          value: formatoMoneda(reporteContable.resultado),
          bg: [219, 234, 254],
          color: [29, 78, 216],
        },
      ];

      boxes.forEach((b) => {
        doc.setFillColor(...b.bg);
        doc.roundedRect(b.x, boxY, boxW, boxH, 2, 2, "F");
        doc.setFontSize(8);
        doc.setTextColor(...b.color);
        doc.text(b.label, b.x + 4, boxY + 7);
        doc.setFontSize(13);
        doc.text(b.value, b.x + 4, boxY + 15);
      });

      // ---------- Tabla de detalle ----------
      autoTable(doc, {
        startY: boxY + boxH + 8,
        head: [["Fecha", "RFC", "Razón Social", "Subtotal", "IVA", "Total", "Tipo"]],
        body: reporteContable.detalle.map((d) => [
          formatoFecha(d.fecha),
          d.rfc,
          d.razonSocial,
          formatoMoneda(d.subtotal),
          formatoMoneda(d.iva),
          formatoMoneda(d.total),
          etiquetaTipoContable(d.tipo),
        ]),
        headStyles: { fillColor: [0, 89, 179], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        styles: { cellPadding: 2 },
      });

      doc.save("reporte-contable-general.pdf");
      addToast("PDF generado correctamente.", "success");
    } catch (err) {
      console.error(err);
      addToast("No se pudo generar el PDF.", "error");
    } finally {
      setExportandoPdfContable(false);
    }
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
                      <th>Estado</th>
                      <th className="rg-col-derecha">Total Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargandoDiot && (
                      <tr>
                        <td colSpan={6} className="rg-sin-resultados">Cargando...</td>
                      </tr>
                    )}

                    {!cargandoDiot && diotGrupos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="rg-sin-resultados">No se encontraron registros.</td>
                      </tr>
                    )}

                    {!cargandoDiot &&
                      diotGrupos.map((g) => (
                        <React.Fragment key={g.rfc}>
                          <tr className="rg-fila-grupo">
                            <td colSpan={5}>{g.rfc} — {g.razonSocial}</td>
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
                              {g.usuario ? formatoMoneda(g.usuario.total) : formatoMoneda(0)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                  </tbody>

                  {!cargandoDiot && diotGrupos.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={5} className="rg-pie-etiqueta">
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
              TAB: Contabilidad General — reporte completo aquí mismo
              ================================================================== */}
          {tabActiva === "contabilidad" && (
            <section className="rg-panel">
              <div className="rg-panel-header">
                <div>
                  <span className="rg-breadcrumb">Reportes › Contabilidad General</span>
                  <h2 className="rg-panel-titulo">Contabilidad General – Ingresos vs. Egresos</h2>
                </div>
                <div className="rg-panel-acciones">
                  <button className="rg-btn rg-btn--secundario" onClick={exportarContableCsv}>
                    Exportar CSV
                  </button>
                  <button
                    className="rg-btn rg-btn--primario"
                    onClick={exportarContablePdf}
                    disabled={exportandoPdfContable}
                  >
                    {exportandoPdfContable ? "Generando..." : "Exportar PDF"}
                  </button>
                </div>
              </div>

              <div className="rg-filtros">
                <div className="rg-filtro">
                  <label>Desde</label>
                  <input type="date" value={contDesde} onChange={(e) => setContDesde(e.target.value)} />
                </div>
                <div className="rg-filtro">
                  <label>Hasta</label>
                  <input type="date" value={contHasta} onChange={(e) => setContHasta(e.target.value)} />
                </div>
                <button className="rg-btn rg-btn--filtrar" onClick={cargarReporteContable}>
                  Aplicar Filtros
                </button>
              </div>

              {errorContable && <div className="rg-alerta rg-alerta--error">{errorContable}</div>}

              {cargandoContable && <div className="rg-sin-resultados">Cargando reporte...</div>}

              {!cargandoContable && reporteContable && (
                <>
                  {/* ---------- Tarjetas: Ingresos / Egresos / Resultado ---------- */}
                  <div className="rg-tarjetas-contables">
                    <div className="rg-tarjeta-contable rg-tarjeta-contable--ingreso">
                      <span className="rg-tarjeta-contable-titulo">Ingresos (Ventas)</span>
                      <span className="rg-tarjeta-contable-monto">{formatoMoneda(reporteContable.ingresos.total)}</span>
                      <div className="rg-tarjeta-contable-detalle">
                        <span>Subtotal: {formatoMoneda(reporteContable.ingresos.subtotal)}</span>
                        <span>IVA: {formatoMoneda(reporteContable.ingresos.iva)}</span>
                      </div>
                    </div>

                    <div className="rg-tarjeta-contable rg-tarjeta-contable--egreso">
                      <span className="rg-tarjeta-contable-titulo">Egresos (Gastos)</span>
                      <span className="rg-tarjeta-contable-monto">{formatoMoneda(reporteContable.egresos.total)}</span>
                      <div className="rg-tarjeta-contable-detalle">
                        <span>Empresa: {formatoMoneda(reporteContable.egresos.empresa.total)}</span>
                        <span>Reembolsos: {formatoMoneda(reporteContable.egresos.empleados.total)}</span>
                      </div>
                    </div>

                    <div
                      className={`rg-tarjeta-contable ${
                        reporteContable.resultado >= 0
                          ? "rg-tarjeta-contable--resultado-positivo"
                          : "rg-tarjeta-contable--resultado-negativo"
                      }`}
                    >
                      <span className="rg-tarjeta-contable-titulo">Resultado Contable</span>
                      <span className="rg-tarjeta-contable-monto">{formatoMoneda(reporteContable.resultado)}</span>
                      <div className="rg-tarjeta-contable-detalle">
                        <span>{reporteContable.resultado >= 0 ? "Superávit del periodo" : "Déficit del periodo"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ---------- Tabla de detalle ---------- */}
                  <div className="rg-tabla-responsive">
                    <table className="rg-tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>RFC</th>
                          <th>Razón Social</th>
                          <th>Subtotal</th>
                          <th>IVA</th>
                          <th>Total</th>
                          <th>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalleContable.length === 0 && (
                          <tr>
                            <td colSpan={7} className="rg-sin-resultados">
                              No hay movimientos registrados en este periodo.
                            </td>
                          </tr>
                        )}

                        {detalleContablePagina.map((d) => (
                          <tr key={`${d.tipo}-${d.id}`}>
                            <td className="rg-texto-gris">{formatoFecha(d.fecha)}</td>
                            <td className="rg-texto-gris">{d.rfc}</td>
                            <td className="rg-celda-usuario">{d.razonSocial}</td>
                            <td className="rg-texto-gris">{formatoMoneda(d.subtotal)}</td>
                            <td className="rg-texto-gris">{formatoMoneda(d.iva)}</td>
                            <td className="rg-col-derecha">{formatoMoneda(d.total)}</td>
                            <td>
                              <span className={`rg-badge-contable ${claseTipoContable(d.tipo)}`}>
                                {etiquetaTipoContable(d.tipo)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  
              {/* 👇 ESTO ES LO QUE TE FALTABA — controles de paginación */}
                  {detalleContable.length > 0 && (
                    <div className="rg-paginacion">
                      <span className="rg-paginacion-resumen">
                        Mostrando {inicioPagContable + 1} -{" "}
                        {Math.min(inicioPagContable + REGISTROS_POR_PAGINA, detalleContable.length)} de{" "}
                        {detalleContable.length} registros
                      </span>
                      <div className="rg-paginacion-controles">
                        <button
                          className="rg-paginacion-flecha"
                          onClick={() => setPaginaContable((p) => Math.max(p - 1, 1))}
                          disabled={paginaContable === 1}
                        >
                          ‹
                        </button>
                        {Array.from({ length: totalPaginasContable }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            className={`rg-paginacion-numero ${
                              n === paginaContable ? "rg-paginacion-numero--activo" : ""
                            }`}
                            onClick={() => setPaginaContable(n)}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          className="rg-paginacion-flecha"
                          onClick={() => setPaginaContable((p) => Math.min(p + 1, totalPaginasContable))}
                          disabled={paginaContable === totalPaginasContable}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  )}
               </>
              )}
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