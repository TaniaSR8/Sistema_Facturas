import { useNavigate } from "react-router-dom";
import api from "../axios";
import "../css/UDashboard.css";
import React, { useState, useEffect, useCallback } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";


import ModalDetalleFactura from "../components/ModalDetalleFactura";


const REGISTROS_POR_PAGINA = 5;

const claseEstado = (estado) => {
  if (estado === "FACTURADO") return "udb-badge-estado--validada";
  if (estado === "NO FACTURADO") return "udb-badge-estado--rechazada";
  return "udb-badge-estado--pendiente";
};

const etiquetaEstado = (estado) => {
  if (estado === "FACTURADO") return "VALIDADA";
  if (estado === "NO FACTURADO") return "RECHAZADA";
  return "PENDIENTE";
};

const formatoFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export default function UDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate("/login");
  };

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [resumen, setResumen] = useState({
    pendientesFotos: 0,
    facturasValidadas: 0,
    facturasRechazadas: 0,
  });

  const [facturas, setFacturas] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // ---------- Modal de Ver Detalle ----------
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const verDetalleFactura = async (id) => {
    setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/facturas/${id}`);
      setFacturaSeleccionada(data);
    } catch (err) {
      console.error("Error al obtener el detalle de la factura:", err);
      addToast("No se pudo cargar el detalle de la factura.", "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const usuarioId = localStorage.getItem("usuarioId");
      const { data } = await api.get("/facturas/dashboard", {
        params: {
          usuarioId,
          buscar: busqueda || undefined,
          pagina: paginaActual,
          porPagina: REGISTROS_POR_PAGINA,
        },
      });

      setResumen(
        data?.resumen || { pendientesFotos: 0, facturasValidadas: 0, facturasRechazadas: 0 }
      );
      setFacturas(Array.isArray(data?.facturas) ? data.facturas : []);
      setTotalRegistros(data?.total ?? 0);
    } catch (err) {
      console.error("Error al cargar el dashboard:", err);
      setError("No se pudo cargar tu información. Intenta de nuevo.");
      addToast("No se pudo cargar tu información. Intenta de nuevo.", "error");
      setFacturas([]);
      setTotalRegistros(0);
    } finally {
      setCargando(false);
    }
  }, [busqueda, paginaActual]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  // Buscar con un pequeño debounce, para no disparar una petición por cada tecla
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPaginaActual(1);
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA));

  return (
    <div className="panel-container">
      {/* ---------- Sidebar (mismo patrón que las demás pantallas de usuario) ---------- */}
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
          <button className="menu-item" onClick={() => navigate("/usuario/foto-ticket")}>
            <span className="menu-icon inicio" />
            Inicio
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/factura")}>
            <span className="menu-icon facturas" />
            Facturas
          </button>
          <button className="menu-item active">
            <span className="menu-icon dashboard" />
            Dashboard
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/mis-fotografias")}>
            <span className="menu-icon fotos" />
            Mis Fotografías
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/perfil")}>
            <span className="menu-icon perfil" />
            Mi Perfil
          </button>
        </nav>
        <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
          <span className="logout-icon" />
          Cerrar Sesión
        </button>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar" />

        <main className="panel-main">
          <div className="udb-header">
            <div>
              <h1 className="udb-titulo">Sistema de Gestión de Facturas</h1>
              <p className="udb-subtitulo">Administra y valida los comprobantes fiscales.</p>
            </div>

            <div className="udb-buscador">
              <span className="udb-buscador-icono">🔍</span>
              <input
                type="text"
                placeholder="Buscar Factura"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="udb-alerta udb-alerta--error">{error}</div>}

          {/* ---------- Tarjetas de resumen ---------- */}
          <div className="udb-resumen-grid">
            <div className="udb-card udb-card--pendientes">
              <span className="udb-badge udb-badge--alta">PRIORIDAD ALTA</span>
              <h3 className="udb-card-titulo">Fotos pendientes de facturar</h3>
              <p className="udb-card-texto">
                Tienes comprobantes capturados que aún no han sido procesados como facturas.
              </p>
              <div className="udb-card-pie">
                <div className="udb-card-numero">
                  <span className="udb-numero-grande">{resumen.pendientesFotos}</span>
                  <span className="udb-numero-etiqueta">COMPROBANTES</span>
                </div>
                <button
                  className="udb-procesar-link"
                  onClick={() => navigate("/usuario/mis-fotografias")}
                >
                  Procesar ahora <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <div className="udb-card udb-card--estados">
              <div className="udb-estado-columna">
                <span className="udb-estado-icono udb-estado-icono--ok">✓</span>
                <span className="udb-badge udb-badge--validada">FACTURAS VALIDADAS</span>
                <span className="udb-numero-grande">
                  {Number(resumen.facturasValidadas || 0).toLocaleString("es-MX")}
                </span>
                <span className="udb-numero-etiqueta">FACTURAS VALIDADAS</span>
              </div>

              <div className="udb-estado-divisor" />

              <div className="udb-estado-columna">
                <span className="udb-estado-icono udb-estado-icono--error">✕</span>
                <span className="udb-badge udb-badge--rechazada">FACTURAS RECHAZADAS</span>
                <span className="udb-numero-grande">
                  {Number(resumen.facturasRechazadas || 0).toLocaleString("es-MX")}
                </span>
                <span className="udb-numero-etiqueta">RECHAZADAS</span>
              </div>
            </div>
          </div>

          {/* ---------- Tabla de facturas del usuario ---------- */}
          <section className="udb-tabla-section">
            <div className="udb-tabla-responsive">
              <table className="udb-tabla">
                <thead>
                  <tr>
                    <th>NO. FACTURA</th>
                    <th>RFC</th>
                    <th>NOMBRE DEL COMERCIO</th>
                    <th>FECHA DE EMISIÓN</th>
                    <th>TIPO DE GASTO</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando && (
                    <tr>
                      <td colSpan={7} className="udb-sin-resultados">
                        Cargando...
                      </td>
                    </tr>
                  )}

                  {!cargando && facturas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="udb-sin-resultados">
                        No se encontraron facturas.
                      </td>
                    </tr>
                  )}

                  {!cargando &&
                    facturas.map((f) => (
                      <tr key={f.id}>
                        <td className="udb-celda-folio">{f.numeroFactura}</td>
                        <td>{f.rfc}</td>
                        <td>{f.razonSocial}</td>
                        <td>{formatoFecha(f.fecha)}</td>
                        <td>{f.tipoGasto || "—"}</td>
                        <td>
                          <span className={`udb-badge-estado ${claseEstado(f.estado)}`}>
                            <span className="udb-badge-estado-punto" />
                            {etiquetaEstado(f.estado)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="udb-ver-detalle"
                            onClick={() => verDetalleFactura(f.id)}
                            disabled={cargandoDetalle}
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="udb-paginacion">
                <span className="udb-paginacion-resumen">
                  Mostrando {totalRegistros === 0 ? 0 : (paginaActual - 1) * REGISTROS_POR_PAGINA + 1}
                  {" - "}
                  {Math.min(paginaActual * REGISTROS_POR_PAGINA, totalRegistros)} de {totalRegistros}{" "}
                  registros
                </span>

                <div className="udb-paginacion-controles">
                  <button
                    className="udb-paginacion-flecha"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                  >
                    ‹ Previous
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p}
                        className={`udb-paginacion-numero ${
                          p === paginaActual ? "udb-paginacion-numero--activo" : ""
                        }`}
                        onClick={() => setPaginaActual(p)}
                      >
                        {p}
                      </button>
                    ))}
                  {totalPaginas > 5 && <span className="udb-paginacion-puntos">…</span>}

                  <button
                    className="udb-paginacion-flecha"
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Next ›
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

      <ModalDetalleFactura
        factura={facturaSeleccionada}
        onClose={() => setFacturaSeleccionada(null)}
      />
    </div>
  );
}