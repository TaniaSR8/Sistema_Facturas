import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/ReportePendientes.css";
import React, { useState, useEffect } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import ModalSubirFactura from "../components/ModalSubirFactura";
import { useToast } from "../components/Toast";

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatoFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
};

const REGISTROS_POR_PAGINA = 4;

export default function ReportePendientes() {
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

  // ---------- Resumen (tarjetas) ----------
  const [resumen, setResumen] = useState(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState("");

  const cargarResumen = async () => {
    setCargandoResumen(true);
    setErrorResumen("");
    try {
      const { data } = await api.get("/reportes-pendientes/resumen");
      setResumen(data);
    } catch (err) {
      setErrorResumen(obtenerMensajeErrorApi(err));
      setResumen(null);
    } finally {
      setCargandoResumen(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  // ---------- Tabla de pendientes ----------
  const [filtroTipoGasto, setFiltroTipoGasto] = useState("");
  const [pendientes, setPendientes] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [idFacturaModal, setIdFacturaModal] = useState(null);
  const [recargarTrigger, setRecargarTrigger] = useState(0);

  useEffect(() => {
    const cargarLista = async () => {
      setCargandoLista(true);
      setErrorLista("");
      try {
        const { data } = await api.get("/reportes-pendientes/lista", {
          params: {
            tipoGasto: filtroTipoGasto || undefined,
            pagina: paginaActual,
            porPagina: REGISTROS_POR_PAGINA,
          },
        });
        setPendientes(Array.isArray(data?.pendientes) ? data.pendientes : []);
        setTotalRegistros(data?.total ?? 0);
      } catch (err) {
        setErrorLista(obtenerMensajeErrorApi(err));
        setPendientes([]);
        setTotalRegistros(0);
      } finally {
        setCargandoLista(false);
      }
    };
    cargarLista();
  }, [filtroTipoGasto, paginaActual, recargarTrigger]);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA));

  const handleSubirFacturaExito = () => {
    setRecargarTrigger((prev) => prev + 1);
    cargarResumen();
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
            <div className="menu-icon rp-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon rp-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon rp-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon rp-icono-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item active" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon rp-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon rp-icono-reporte-ventas"></div>
            Reporte de Ventas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon rp-icono-perfil"></div>
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
        <div className="top-blue-bar rp-topbar">
          <h1 className="rp-topbar-titulo">Reporte de Facturas Pendientes</h1>
        </div>

        <main className="panel-main">
          {errorResumen && <div className="rp-alerta rp-alerta--error">{errorResumen}</div>}

          {!cargandoResumen && resumen && resumen.diasParaCierre <= 5 && resumen.totalPendientes > 0 && (
            <div className="rp-aviso">
              <span className="rp-aviso-icono">⚠</span>
              <div>
                <strong>Aviso de Cierre Próximo</strong>
                <p>
                  Se han detectado {resumen.totalPendientes} gastos deducibles no facturados. El periodo de
                  conciliación cierra en {resumen.diasParaCierre} día{resumen.diasParaCierre === 1 ? "" : "s"} naturales.
                </p>
              </div>
            </div>
          )}

          {/* ---------- Tarjetas ---------- */}
          <div className="rp-tarjetas">
            <div className="rp-tarjeta">
              <span className="rp-tarjeta-titulo">Resumen de Facturación</span>
              {cargandoResumen ? (
                <div className="rp-tarjeta-cargando">Cargando...</div>
              ) : (
                <>
                  <div className="rp-tarjeta-principal">
                    <span className="rp-tarjeta-etiqueta">Monto Total</span>
                    <span className="rp-tarjeta-valor">{formatoMoneda(resumen?.montoTotal)}</span>
                  </div>
                  <div className="rp-tarjeta-fila">
                    <div>
                      <span className="rp-tarjeta-etiqueta">IVA (16%)</span>
                      <span className="rp-tarjeta-valor-chico">{formatoMoneda(resumen?.iva)}</span>
                    </div>
                    <div>
                      <span className="rp-tarjeta-etiqueta">Subtotal</span>
                      <span className="rp-tarjeta-valor-chico">{formatoMoneda(resumen?.subtotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rp-tarjeta rp-tarjeta--desglose">
              <span className="rp-tarjeta-titulo">Top 3 Tipos de Gasto</span>
              {cargandoResumen ? (
                <div className="rp-tarjeta-cargando">Cargando...</div>
              ) : resumen?.topTipos?.length ? (
                <ul className="rp-desglose-lista">
                  {resumen.topTipos.map((t, i) => (
                    <li key={t.tipoGasto} className="rp-desglose-item">
                      <span className={`rp-desglose-punto rp-desglose-punto--${i}`} />
                      <span className="rp-desglose-nombre">{t.tipoGasto}</span>
                      <span className="rp-desglose-monto">{formatoMoneda(t.monto)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rp-tarjeta-cargando">Sin datos aún.</div>
              )}
            </div>
          </div>

          {/* ---------- Tabla ---------- */}
          <section className="rp-tabla-section">
            <div className="rp-tabla-header">
              <h2 className="rp-tabla-titulo">Detalle de Facturas Pendientes</h2>
              <select
                className="rp-filtro-tipo"
                value={filtroTipoGasto}
                onChange={(e) => {
                  setFiltroTipoGasto(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="">Todos los tipos</option>
                {resumen?.topTipos?.map((t) => (
                  <option key={t.tipoGasto} value={t.tipoGasto}>
                    {t.tipoGasto}
                  </option>
                ))}
              </select>
            </div>

            {errorLista && <div className="rp-alerta rp-alerta--error">{errorLista}</div>}

            <div className="rp-tabla-responsive">
              <table className="rp-tabla">
                <thead>
                  <tr>
                    <th>MONTO</th>
                    <th>TIPO DE GASTO</th>
                    <th>FECHA</th>
                    <th>FOTOGRAFÍA</th>
                    <th>ESTADO</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {cargandoLista && (
                    <tr>
                      <td colSpan={6} className="rp-sin-resultados">Cargando...</td>
                    </tr>
                  )}

                  {!cargandoLista && pendientes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="rp-sin-resultados">No hay facturas pendientes.</td>
                    </tr>
                  )}

                  {!cargandoLista &&
                    pendientes.map((p) => (
                      <tr key={p.id}>
                        <td className="rp-celda-monto">{formatoMoneda(p.monto)}</td>
                        <td>{p.tipoGasto}</td>
                        <td className="rp-texto-gris">{formatoFecha(p.fecha)}</td>
                        <td>
                          <a href={p.fotoUrl} target="_blank" rel="noopener noreferrer" className="rp-miniatura-link">
                            <img src={p.fotoUrl} alt="Comprobante" className="rp-miniatura" />
                          </a>
                        </td>
                        <td>
                          <span className="rp-badge-pendiente">PENDIENTE</span>
                        </td>
                        <td>
                          <button className="rp-btn-subir" onClick={() => setIdFacturaModal(p.id)}>
                            Subir Factura
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!cargandoLista && totalRegistros > 0 && (
              <div className="rp-paginacion">
                <span className="rp-paginacion-resumen">
                  Mostrando {(paginaActual - 1) * REGISTROS_POR_PAGINA + 1} -{" "}
                  {Math.min(paginaActual * REGISTROS_POR_PAGINA, totalRegistros)} de {totalRegistros} pendientes
                </span>
                <div className="rp-paginacion-controles">
                  <button
                    className="rp-paginacion-flecha"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={`rp-paginacion-numero ${n === paginaActual ? "rp-paginacion-numero--activo" : ""}`}
                      onClick={() => setPaginaActual(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    className="rp-paginacion-flecha"
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
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

      {idFacturaModal && (
        <ModalSubirFactura
          idParam={idFacturaModal}
          onClose={() => setIdFacturaModal(null)}
          onExito={handleSubirFacturaExito}
        />
      )}
    </div>
  );
}