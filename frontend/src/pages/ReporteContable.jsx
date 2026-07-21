import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReporteContable.css";
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

const etiquetaTipo = (tipo) => {
  if (tipo === "Ingreso") return "Ingreso";
  if (tipo === "Egreso-Empresa") return "Egreso (Empresa)";
  if (tipo === "Egreso-Reembolso") return "Egreso (Reembolso)";
  return tipo;
};

const claseTipo = (tipo) => {
  if (tipo === "Ingreso") return "rc-badge-tipo--ingreso";
  if (tipo === "Egreso-Empresa") return "rc-badge-tipo--egreso-empresa";
  return "rc-badge-tipo--egreso-reembolso";
};

export default function ReporteContable() {
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

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const cargarReporte = async () => {
    setCargando(true);
    setError("");
    try {
      const { data } = await api.get("/reportes/contabilidad-general", {
        params: {
          desde: desde || undefined,
          hasta: hasta || undefined,
        },
      });
      setReporte(data);
    } catch (err) {
      setError(obtenerMensajeErrorApi(err));
      setReporte(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Exportar CSV ----------
  const exportarCsv = () => {
    if (!reporte || reporte.detalle.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }

    const filas = [["Fecha", "RFC", "Razón Social", "Subtotal", "IVA", "Total", "Tipo"]];
    reporte.detalle.forEach((d) => {
      filas.push([
        formatoFecha(d.fecha),
        d.rfc,
        d.razonSocial,
        d.subtotal,
        d.iva,
        d.total,
        etiquetaTipo(d.tipo),
      ]);
    });

    filas.push([]);
    filas.push(["Total Ingresos", "", "", "", "", reporte.ingresos.total, ""]);
    filas.push(["Total Egresos", "", "", "", "", reporte.egresos.total, ""]);
    filas.push(["Resultado Contable", "", "", "", "", reporte.resultado, ""]);

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

  // ---------- Exportar PDF ----------
  const exportarPdf = async () => {
    if (!reporte || reporte.detalle.length === 0) {
      addToast("No hay registros para exportar.", "warning");
      return;
    }
    setExportandoPdf(true);

    const filasHtml = reporte.detalle
      .map(
        (d) => `
        <tr>
          <td>${formatoFecha(d.fecha)}</td>
          <td>${d.rfc}</td>
          <td>${d.razonSocial}</td>
          <td>${formatoMoneda(d.subtotal)}</td>
          <td>${formatoMoneda(d.iva)}</td>
          <td>${formatoMoneda(d.total)}</td>
          <td>${etiquetaTipo(d.tipo)}</td>
        </tr>`
      )
      .join("");

    const fechaHoy = new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1A2530; padding: 10px; background:#ffffff;">
        <h1 style="font-size: 20px; margin-bottom: 2px;">Sistema de Control de Facturas</h1>
        <p style="font-size: 13px; color: #64748b; margin-top: 0;">Reporte Contable General — Generado el ${fechaHoy}</p>

        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="width:33%; background:#D1FAE5; border-radius:8px; padding:12px;">
              <strong style="font-size:11px; color:#059669;">TOTAL INGRESOS</strong><br/>
              <span style="font-size:16px; font-weight:bold;">${formatoMoneda(reporte.ingresos.total)}</span>
            </td>
            <td style="width:2%;"></td>
            <td style="width:33%; background:#FEE2E2; border-radius:8px; padding:12px;">
              <strong style="font-size:11px; color:#DC2626;">TOTAL EGRESOS</strong><br/>
              <span style="font-size:16px; font-weight:bold;">${formatoMoneda(reporte.egresos.total)}</span>
            </td>
            <td style="width:2%;"></td>
            <td style="width:33%; background:#DBEAFE; border-radius:8px; padding:12px;">
              <strong style="font-size:11px; color:#1D4ED8;">RESULTADO CONTABLE</strong><br/>
              <span style="font-size:16px; font-weight:bold;">${formatoMoneda(reporte.resultado)}</span>
            </td>
          </tr>
        </table>

        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Fecha</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">RFC</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Razón Social</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Subtotal</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">IVA</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Total</th>
              <th style="background:#0059B3;color:#fff;padding:8px;font-size:11px;text-align:left;">Tipo</th>
            </tr>
          </thead>
          <tbody>${filasHtml}</tbody>
        </table>
      </div>
    `;

    const contenedor = document.createElement("div");
    contenedor.style.position = "fixed";
    contenedor.style.top = "0";
    contenedor.style.left = "0";
    contenedor.style.zIndex = "-9999";
    contenedor.style.backgroundColor = "#ffffff";
    contenedor.style.width = "1400px";
    contenedor.innerHTML = html;
    document.body.appendChild(contenedor);

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: "reporte-contable-general.pdf",
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
      setTimeout(() => {
        if (document.body.contains(contenedor)) {
          document.body.removeChild(contenedor);
        }
      }, 2000);
      setExportandoPdf(false);
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
            <div className="menu-icon rc-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon rc-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon rc-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon rc-icono-reportes-global"></div>
            Reportes Globales
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon rc-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon rc-icono-reporte-ventas"></div>
            Reporte de Ventas
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/reporte-contable")}>
            <div className="menu-icon rc-icono-contable"></div>
            Reporte Contable
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon rc-icono-perfil"></div>
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
        <div className="top-blue-bar rc-topbar">
          <h1 className="rc-topbar-titulo">Reporte Contable General</h1>
        </div>

        <main className="panel-main">
          {error && <div className="rc-alerta rc-alerta--error">{error}</div>}

          {/* ---------- Filtros ---------- */}
          <div className="rc-filtros">
            <div className="rc-filtro">
              <label>Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="rc-filtro">
              <label>Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <button className="rc-btn rc-btn--filtrar" onClick={cargarReporte}>
              Aplicar Filtros
            </button>
            <div className="rc-filtros-acciones">
              <button className="rc-btn rc-btn--secundario" onClick={exportarCsv}>
                Exportar CSV
              </button>
              <button className="rc-btn rc-btn--primario" onClick={exportarPdf} disabled={exportandoPdf}>
                {exportandoPdf ? "Generando..." : "Exportar PDF"}
              </button>
            </div>
          </div>

          {cargando && <div className="rc-cargando">Cargando reporte...</div>}

          {!cargando && reporte && (
            <>
              {/* ---------- Tarjetas: Ingresos / Egresos / Resultado ---------- */}
              <div className="rc-tarjetas">
                <div className="rc-tarjeta rc-tarjeta--ingreso">
                  <span className="rc-tarjeta-titulo">Ingresos (Ventas)</span>
                  <span className="rc-tarjeta-monto">{formatoMoneda(reporte.ingresos.total)}</span>
                  <div className="rc-tarjeta-detalle">
                    <span>Subtotal: {formatoMoneda(reporte.ingresos.subtotal)}</span>
                    <span>IVA: {formatoMoneda(reporte.ingresos.iva)}</span>
                  </div>
                </div>

                <div className="rc-tarjeta rc-tarjeta--egreso">
                  <span className="rc-tarjeta-titulo">Egresos (Gastos)</span>
                  <span className="rc-tarjeta-monto">{formatoMoneda(reporte.egresos.total)}</span>
                  <div className="rc-tarjeta-detalle">
                    <span>Empresa: {formatoMoneda(reporte.egresos.empresa.total)}</span>
                    <span>Reembolsos: {formatoMoneda(reporte.egresos.empleados.total)}</span>
                  </div>
                </div>

                <div
                  className={`rc-tarjeta ${
                    reporte.resultado >= 0 ? "rc-tarjeta--resultado-positivo" : "rc-tarjeta--resultado-negativo"
                  }`}
                >
                  <span className="rc-tarjeta-titulo">Resultado Contable</span>
                  <span className="rc-tarjeta-monto">{formatoMoneda(reporte.resultado)}</span>
                  <div className="rc-tarjeta-detalle">
                    <span>{reporte.resultado >= 0 ? "Superávit del periodo" : "Déficit del periodo"}</span>
                  </div>
                </div>
              </div>

              {/* ---------- Tabla de detalle ---------- */}
              <section className="rc-tabla-section">
                <h2 className="rc-tabla-titulo">Detalle de Movimientos</h2>

                <div className="rc-tabla-responsive">
                  <table className="rc-tabla">
                    <thead>
                      <tr>
                        <th>FECHA</th>
                        <th>RFC</th>
                        <th>RAZÓN SOCIAL</th>
                        <th>SUBTOTAL</th>
                        <th>IVA</th>
                        <th>TOTAL</th>
                        <th>TIPO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.detalle.length === 0 && (
                        <tr>
                          <td colSpan={7} className="rc-sin-resultados">
                            No hay movimientos registrados en este periodo.
                          </td>
                        </tr>
                      )}

                      {reporte.detalle.map((d) => (
                        <tr key={`${d.tipo}-${d.id}`}>
                          <td className="rc-texto-gris">{formatoFecha(d.fecha)}</td>
                          <td className="rc-texto-gris">{d.rfc}</td>
                          <td className="rc-celda-fuerte">{d.razonSocial}</td>
                          <td className="rc-texto-gris">{formatoMoneda(d.subtotal)}</td>
                          <td className="rc-texto-gris">{formatoMoneda(d.iva)}</td>
                          <td className="rc-celda-total">{formatoMoneda(d.total)}</td>
                          <td>
                            <span className={`rc-badge-tipo ${claseTipo(d.tipo)}`}>{etiquetaTipo(d.tipo)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
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