import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReportePorUsuario.css";
import React, { useState, useEffect, useMemo } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";

import html2pdf from "html2pdf.js";

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const claseEstado = (estado) => {
  if (estado === "FACTURADO") return "rpu-badge-estado--facturado";
  if (estado === "NO FACTURADO") return "rpu-badge-estado--no-facturado";
  return "rpu-badge-estado--pendiente";
};

// ---------------------------------------------------------------------------
// Genera el HTML del reporte imprimible, reutilizado tanto para "Exportar PDF"
// (ventana nueva) como si en el futuro quieres reusarlo en otro lado.
// ---------------------------------------------------------------------------
const construirFilasTabla = (facturas) =>
  facturas
    .map(
      (f) => `
        <tr>
          <td>${f.concepto ?? ""}</td>
          <td>${f.tipoGasto ?? ""}</td>
          <td>${formatoFecha(f.fecha)}</td>
          <td>${formatoMoneda(f.subtotal)}</td>
          <td>${formatoMoneda(f.iva)}</td>
          <td>${formatoMoneda(f.total)}</td>
          <td>${f.estado ?? ""}</td>
          <td>${f.facturadoA === "PERSONA" ? "Persona" : "Blupster"}</td>
        </tr>`
    )
    .join("");

const construirHtmlReporte = (detalle) => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Reporte-${detalle.usuario.nombre.replace(/\s+/g, "_")}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1A2530; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .correo { color: #64748b; font-size: 13px; margin-bottom: 16px; }
  .warning {
    background-color: #ffcccc;
    border: 1px solid #cc0000;
    color: #660000;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    margin-bottom: 20px;
  }
  h2 { font-size: 15px; margin-top: 28px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th {
    background-color: #0059B3;
    color: #ffffff;
    text-align: left;
    padding: 8px;
    font-size: 11px;
  }
  td {
    padding: 8px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
  }
  .total-fila td {
    font-weight: bold;
    background-color: #F8FAFC;
  }
</style>
</head>
<body>
  <h1>Reporte de ${detalle.usuario.nombre}</h1>
  <div class="correo">${detalle.usuario.correo}</div>

  ${
    detalle.warning
      ? `<div class="warning"><strong>Aviso de cierre próximo:</strong> El usuario ${detalle.usuario.nombre} tiene ${formatoMoneda(
          detalle.totalPersona
        )} facturado a su nombre. Emitir recibo antes del cierre mensual.</div>`
      : ""
  }

  <h2>Facturado a Blupster</h2>
  <table>
    <thead>
      <tr>
        <th>Concepto</th><th>Tipo de Gasto</th><th>Fecha</th><th>Subtotal</th>
        <th>IVA</th><th>Total</th><th>Estado</th><th>Facturado a</th>
      </tr>
    </thead>
    <tbody>
      ${construirFilasTabla(detalle.facturasBlupster) || `<tr><td colspan="8">Sin facturas.</td></tr>`}
      <tr class="total-fila">
        <td colspan="5">Total Blupster</td>
        <td colspan="3">${formatoMoneda(detalle.totalBlupster)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Facturado a la Persona</h2>
  <table>
    <thead>
      <tr>
        <th>Concepto</th><th>Tipo de Gasto</th><th>Fecha</th><th>Subtotal</th>
        <th>IVA</th><th>Total</th><th>Estado</th><th>Facturado a</th>
      </tr>
    </thead>
    <tbody>
      ${construirFilasTabla(detalle.facturasPersona) || `<tr><td colspan="8">Sin facturas.</td></tr>`}
      <tr class="total-fila">
        <td colspan="5">Total Persona</td>
        <td colspan="3">${formatoMoneda(detalle.totalPersona)}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

export default function ReportePorUsuario() {
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

  // ---------- Lista general de usuarios ----------
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const cargarUsuarios = async () => {
      setCargandoUsuarios(true);
      setErrorLista("");
      try {
        const { data } = await api.get("/reportes/usuarios");
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("No se pudo cargar el reporte por usuario.", err);
        setUsuarios([]);
        setErrorLista(obtenerMensajeErrorApi(err));
      } finally {
        setCargandoUsuarios(false);
      }
    };
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return usuarios;
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(termino) || u.correo.toLowerCase().includes(termino)
    );
  }, [usuarios, busqueda]);

  // ---------- Detalle del usuario seleccionado ----------
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const seleccionarUsuario = async (id) => {
    setUsuarioSeleccionadoId(id);
    setCargandoDetalle(true);
    setDetalle(null);
    try {
      const { data } = await api.get(`/reportes/usuario/${id}`);
      setDetalle(data);
    } catch (err) {
      addToast(obtenerMensajeErrorApi(err), "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleSolicitarRecibo = async () => {
    if (!usuarioSeleccionadoId) return;
    setEnviandoSolicitud(true);
    try {
      await api.post(`/reportes/usuario/${usuarioSeleccionadoId}/solicitar-recibo`);
      addToast("Solicitud de emisión de recibo enviada.", "success");
    } catch (err) {
      addToast(obtenerMensajeErrorApi(err), "error");
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // ---------- Imprimir (pantalla actual, con sidebar oculto por CSS) ----------
  const handleImprimir = () => {
    window.print();
  };

// ---------- Exportar PDF (descarga un archivo .pdf real, sin diálogo de impresión) ----------
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const handleExportarPDF = async () => {
    if (!detalle || exportandoPdf) return;
    setExportandoPdf(true);

    const elemento = document.querySelector(".rpu-imprimible");
    if (!elemento) {
      addToast("No se encontró el contenido del reporte para exportar.", "error");
      setExportandoPdf(false);
      return;
    }

    const nombreArchivo = `reporte-${detalle.usuario.nombre.replace(/\s+/g, "_")}.pdf`;

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: nombreArchivo,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(elemento)
        .save();

      addToast("PDF generado correctamente.", "success");
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      addToast("No se pudo generar el PDF. Intenta de nuevo.", "error");
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleExportarExcel = () => {
    if (!detalle) return;

    const filas = [];
    filas.push(["Reporte de", detalle.usuario.nombre]);
    filas.push([]);
    filas.push(["FACTURADO A BLUPSTER"]);
    filas.push(["Concepto", "Tipo de Gasto", "Fecha", "Subtotal", "IVA", "Total", "Estado", "Facturado a"]);
    detalle.facturasBlupster.forEach((f) => {
      filas.push([f.concepto, f.tipoGasto, f.fecha, f.subtotal, f.iva, f.total, f.estado, f.facturadoA]);
    });
    filas.push(["", "", "", "", "", "Total Blupster", detalle.totalBlupster]);
    filas.push([]);
    filas.push(["FACTURADO A LA PERSONA"]);
    filas.push(["Concepto", "Tipo de Gasto", "Fecha", "Subtotal", "IVA", "Total", "Estado", "Facturado a"]);
    detalle.facturasPersona.forEach((f) => {
      filas.push([f.concepto, f.tipoGasto, f.fecha, f.subtotal, f.iva, f.total, f.estado, f.facturadoA]);
    });
    filas.push(["", "", "", "", "", "Total Persona", detalle.totalPersona]);

    const csv = filas
      .map((fila) => fila.map((celda) => `"${String(celda ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${detalle.usuario.nombre.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTabla = (titulo, facturas, total) => (
    <div className="rpu-tabla-bloque">
      <h3 className="rpu-tabla-titulo">{titulo}</h3>
      <div className="rpu-tabla-responsive">
        <table className="rpu-tabla">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Tipo de Gasto</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Facturado a</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 && (
              <tr>
                <td colSpan={8} className="rpu-sin-resultados">
                  Sin facturas en esta categoría.
                </td>
              </tr>
            )}
            {facturas.map((f) => (
              <tr key={f.id}>
                <td className="rpu-celda-concepto">{f.concepto}</td>
                <td>{f.tipoGasto}</td>
                <td className="rpu-texto-gris">{formatoFecha(f.fecha)}</td>
                <td>{formatoMoneda(f.subtotal)}</td>
                <td>{formatoMoneda(f.iva)}</td>
                <td className="rpu-celda-total">{formatoMoneda(f.total)}</td>
                <td>
                  <span className={`rpu-badge-estado ${claseEstado(f.estado)}`}>{f.estado}</span>
                </td>
                <td>
                  <span
                    className={`rpu-badge-facturado-a ${
                      f.facturadoA === "PERSONA" ? "rpu-badge-facturado-a--persona" : "rpu-badge-facturado-a--blupster"
                    }`}
                  >
                    <span className="rpu-badge-check">✓</span>
                    {f.facturadoA === "PERSONA" ? "Persona" : "Blupster"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="rpu-pie-etiqueta">
                Total {titulo}
              </td>
              <td colSpan={3} className="rpu-pie-total">
                {formatoMoneda(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="panel-container">
      {/* ---------- Sidebar (administrador) ---------- */}
      <aside className="panel-sidebar rpu-no-print">
        <div className="sidebar-top-wrapper">
          <button
            className="hamburger-btn"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
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
            <div className="menu-icon rpu-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon rpu-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon rpu-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon rpu-icono-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon rpu-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>

          <button className="menu-item" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon rpu-icono-reporte-ventas"></div>
            Reporte de ventas del mes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon rpu-icono-perfil"></div>
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
        <div className="top-blue-bar rpu-topbar rpu-no-print">
          <h1 className="rpu-topbar-titulo">Reporte por Usuario</h1>
        </div>

        <main className="panel-main">
          <div className="rpu-layout">
            {/* ---------- Columna izquierda: lista de usuarios ---------- */}
            <div className="rpu-lista-card rpu-no-print">
              <div className="rpu-lista-header">
                <h2 className="rpu-lista-titulo">Usuarios</h2>
                <input
                  type="text"
                  className="rpu-buscador"
                  placeholder="Buscar por nombre o correo"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              {errorLista && <div className="rpu-alerta rpu-alerta--error">{errorLista}</div>}

              <div className="rpu-lista-scroll">
                {cargandoUsuarios && <div className="rpu-lista-estado">Cargando usuarios...</div>}

                {!cargandoUsuarios && usuariosFiltrados.length === 0 && (
                  <div className="rpu-lista-estado">No se encontraron usuarios.</div>
                )}

                {!cargandoUsuarios &&
                  usuariosFiltrados.map((u) => (
                    <button
                      key={u.id}
                      className={`rpu-item ${usuarioSeleccionadoId === u.id ? "rpu-item--activo" : ""}`}
                      onClick={() => seleccionarUsuario(u.id)}
                    >
                      <div className="rpu-item-encabezado">
                        <span className="rpu-item-nombre">{u.nombre}</span>
                        {u.warning && <span className="rpu-item-warning-punto" title="Aviso de cierre próximo" />}
                      </div>
                      <span className="rpu-item-correo">{u.correo}</span>
                      <div className="rpu-item-totales">
                        <span className="rpu-item-total-chip rpu-item-total-chip--blupster">
                          Blupster: {formatoMoneda(u.totalBlupster)}
                        </span>
                        <span className="rpu-item-total-chip rpu-item-total-chip--persona">
                          Persona: {formatoMoneda(u.totalPersona)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* ---------- Columna derecha: reporte detallado ---------- */}
            <div className="rpu-detalle-card">
              {!usuarioSeleccionadoId && !cargandoDetalle && (
                <div className="rpu-detalle-vacio">
                  <span>📊</span>
                  Selecciona un usuario de la lista para ver su reporte.
                </div>
              )}

              {cargandoDetalle && <div className="rpu-detalle-vacio">Cargando reporte...</div>}

              {detalle && !cargandoDetalle && (
                <div className="rpu-imprimible">
                  <div className="rpu-detalle-header">
                    <div>
                      <h2 className="rpu-detalle-titulo">Reporte de {detalle.usuario.nombre}</h2>
                      <span className="rpu-detalle-correo">{detalle.usuario.correo}</span>
                    </div>

                    <div className="rpu-detalle-acciones rpu-no-print" data-html2canvas-ignore="true">
                      {detalle.totalPersona > 0 && (
                        <button
                          className="rpu-btn-solicitar"
                          onClick={handleSolicitarRecibo}
                          disabled={enviandoSolicitud}
                        >
                          {enviandoSolicitud ? "Enviando..." : "Solicitar emisión de recibo"}
                        </button>
                      )}
                     <button className="rpu-btn-secundario" onClick={handleExportarPDF} disabled={exportandoPdf}>
                        {exportandoPdf ? "Generando..." : "Exportar PDF"}
                      </button>
                      <button className="rpu-btn-secundario" onClick={handleExportarExcel}>
                        Exportar Excel
                      </button>
                      <button className="rpu-btn-secundario" onClick={handleImprimir}>
                        Imprimir
                      </button>
                    </div>
                  </div>

                  {detalle.warning && (
                    <div className="rpu-warning">
                      <span className="rpu-warning-icono">⚠</span>
                      <span>
                        <strong>Aviso de cierre próximo:</strong> El usuario {detalle.usuario.nombre} tiene{" "}
                        {formatoMoneda(detalle.totalPersona)} facturado a su nombre. Emitir recibo antes del cierre
                        mensual.
                      </span>
                    </div>
                  )}

                  {renderTabla("Facturado a Blupster", detalle.facturasBlupster, detalle.totalBlupster)}
                  {renderTabla("Facturado a la Persona", detalle.facturasPersona, detalle.totalPersona)}
                </div>
              )}
            </div>
          </div>
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