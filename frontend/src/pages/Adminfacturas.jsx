import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";

import "../css/AdminFacturas.css";
import React, { useState, useEffect, useMemo } from "react";
// ----------------------



// ---------------------------------------------------------------------------
// Catálogos (mismos códigos que usa el resto del sistema)
// ---------------------------------------------------------------------------
const ESTADOS = [
  { valor: "", etiqueta: "Todos los estados" },
  { valor: "FACTURADO", etiqueta: "Facturado" },
  { valor: "NO FACTURADO", etiqueta: "No facturado" },
  { valor: "PENDIENTE", etiqueta: "Pendiente" },
];

// Catálogo de respaldo por si falla la carga desde el backend
// (usa los mismos códigos reales de tu tabla tipos_gasto)
const TIPOS_GASTO_RESPALDO = [
  { valor: "", etiqueta: "Todos los tipos" },
  { valor: "Gastos en general", etiqueta: "Gastos en general" },
  { valor: "Equipo de transporte", etiqueta: "Equipo de transporte" },
  { valor: "Adquisición de mercancías", etiqueta: "Adquisición de mercancías" },
];

// La tabla arranca vacía: se llena exclusivamente con lo que devuelva el
// backend en el useEffect de abajo (GET /admin/facturas).

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const REGISTROS_POR_PAGINA = 10;

// Genera la lista de botones de paginación con "..." cuando hay muchas páginas
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

export default function AdminFacturas() {
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipoGasto, setFiltroTipoGasto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [tiposGasto, setTiposGasto] = useState(TIPOS_GASTO_RESPALDO);

  useEffect(() => {
    const cargarTiposGasto = async () => {
      try {
        const { data } = await api.get("/facturas/catalogos/tipos-gasto");
        if (Array.isArray(data) && data.length > 0) {
          setTiposGasto([
            { valor: "", etiqueta: "Todos los tipos" },
            ...data.map((t) => ({ valor: t.descripcion, etiqueta: t.descripcion })),
          ]);
        }
      } catch (err) {
        console.warn("No se pudo cargar el catálogo de tipos de gasto, usando respaldo.", err);
        setTiposGasto(TIPOS_GASTO_RESPALDO);
      }
    };
    cargarTiposGasto();
  }, []);

  const [facturas, setFacturas] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);

  // ---------------------------------------------------------------------
  // TODO: conectar al backend real (aún no existe /admin/facturas).
  // En cuanto responda, la tabla se llena sola con lo que devuelva.
  // Sugerencia de ruta: GET /admin/facturas?estado=&tipoGasto=&desde=&hasta=&pagina=
  // ---------------------------------------------------------------------
  useEffect(() => {
    const cargarFacturas = async () => {
      setCargando(true);
      setError("");
      try {
        const { data } = await api.get("/facturas/listar", {
          params: {
            estado: filtroEstado || undefined,
            tipoGasto: filtroTipoGasto || undefined,
            desde: fechaInicio || undefined,
            hasta: fechaFin || undefined,
            pagina: paginaActual,
            porPagina: REGISTROS_POR_PAGINA,
          },
        });

        const lista = Array.isArray(data?.facturas) ? data.facturas : data;
        setFacturas(Array.isArray(lista) ? lista : []);
        setTotalRegistros(data?.total ?? (Array.isArray(lista) ? lista.length : 0));
      } catch (err) {
        // El backend de listado aún no existe (o falló): dejamos la tabla
        // vacía en vez de mostrar datos falsos.
        console.warn("No se pudo cargar /admin/facturas.", err);
        setFacturas([]);
        setTotalRegistros(0);
        setError("No se pudo cargar el listado de facturas. Intenta de nuevo más tarde.");
      } finally {
        setCargando(false);
      }
    };
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTipoGasto, fechaInicio, fechaFin, paginaActual]);

  // Filtrado en cliente sobre lo que haya devuelto el backend. Útil como
  // capa extra aunque idealmente el filtrado real lo haga el backend
  // (por eso también se envían estado/tipoGasto como params en el fetch).
  const facturasFiltradas = useMemo(() => {
    return facturas.filter((f) => {
      if (filtroEstado && f.estado !== filtroEstado) return false;
      if (filtroTipoGasto && f.tipoGasto !== filtroTipoGasto) return false;
      return true;
    });
  }, [facturas, filtroEstado, filtroTipoGasto]);

  const totalPaginasCliente = Math.max(1, Math.ceil(facturasFiltradas.length / REGISTROS_POR_PAGINA));
  const indiceUltimo = paginaActual * REGISTROS_POR_PAGINA;
  const indicePrimero = indiceUltimo - REGISTROS_POR_PAGINA;
  const registrosPagina = facturasFiltradas.slice(indicePrimero, indiceUltimo);

  const paginasAMostrar = generarPaginas(totalPaginasCliente, paginaActual);

  const claseEstado = (estado) => {
    if (estado === "FACTURADO") return "afac-badge-estado--facturado";
    if (estado === "NO FACTURADO") return "afac-badge-estado--no-facturado";
    return "afac-badge-estado--pendiente";
  };

  // La factura se considera "completa" solo cuando el usuario ya subió
  // el XML y el PDF. Esto es lo que decide qué botón mostrar en Acción,
  // independientemente del campo "estado" (que puede reflejar otra cosa,
  // como una validación posterior del administrador).
  const facturaCompleta = (f) => Boolean(f.tieneXml && f.tienePdf);

  return (
    <div className="panel-container">
      {/* ---------- Sidebar (administrador) ---------- */}
      <aside className="panel-sidebar">
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
          <button className="menu-item active" onClick={() => navigate("/admin/facturas")}>
            <div className="menu-icon afac-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon afac-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon afac-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon afac-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon afac-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/usuarios")}>
            <div className="menu-icon afac-usuarios"></div>
            Usuarios
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/perfil")}>
            <div className="menu-icon afac-perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout" onClick={() => navigate("/login")}>
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar afac-topbar">
          <h1 className="afac-topbar-titulo">Bienvenido</h1>
        </div>

        <main className="panel-main">
          <p className="afac-subtitulo">
            Administre y valide los comprobantes fiscales de la organización.
          </p>

          {/* ---------- Filtros ---------- */}
          <section className="afac-filtros">
            <div className="afac-filtro">
              <label htmlFor="filtro-estado">Estado</label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {ESTADOS.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="afac-filtro">
              <label htmlFor="filtro-tipo-gasto">Tipo de Gasto</label>
              <select
                id="filtro-tipo-gasto"
                value={filtroTipoGasto}
                onChange={(e) => {
                  setFiltroTipoGasto(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {tiposGasto.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="afac-filtro afac-filtro--rango">
              <label>Rango de Fechas</label>
              <div className="afac-rango-fechas">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setPaginaActual(1);
                  }}
                />
                <span className="afac-rango-separador">a</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setPaginaActual(1);
                  }}
                />
              </div>
            </div>
          </section>

          {error && <div className="afac-alerta afac-alerta--error">{error}</div>}

          {/* ---------- Tabla ---------- */}
          <section className="afac-tabla-section">
            <div className="afac-tabla-responsive">
              <table className="afac-tabla">
                <thead>
                  <tr>
                    <th>USUARIO</th>
                    <th>RAZÓN SOCIAL</th>
                    <th>RFC</th>
                    <th>FECHA</th>
                    <th>SUBTOTAL</th>
                    <th>IVA</th>
                    <th>TOTAL</th>
                    <th>GASTO</th>
                    <th>ESTADO</th>
                    <th>DEDUCCIÓN</th>
                    <th>ARCHIVOS</th>
                    <th>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPagina.map((f) => (
                    <tr key={f.id}>
                      <td className="afac-texto-gris">{f.nombreUsuario || "—"}</td>
                      <td className="afac-celda-razon">{f.razonSocial}</td>
                      <td className="afac-texto-gris">{f.rfc}</td>
                      <td className="afac-texto-gris">{f.fecha}</td>
                      <td>{formatoMoneda(f.subtotal)}</td>
                      <td>{formatoMoneda(f.iva)}</td>
                      <td className="afac-celda-total">{formatoMoneda(f.total)}</td>
                      <td>
                        <span className="afac-badge-gasto">{f.tipoGasto}</span>
                      </td>
                      <td>
                        <span className={`afac-badge-estado ${claseEstado(f.estado)}`}>
                          <span className="afac-badge-estado-punto" />
                          {f.estado}
                        </span>
                      </td>
                      <td>
                        <span className="afac-badge-deduccion">{f.deduccion || "—"}</span>
                      </td>
                      <td>
                        <span className="afac-archivos-iconos">
                          {f.tieneFoto && (
                            <span title="Foto del comprobante subida">📷</span>
                          )}
                          {f.tieneXml && f.tienePdf && (
                            <span title="XML y PDF de la factura subidos">🗎</span>
                          )}
                          {!f.tieneFoto && !(f.tieneXml && f.tienePdf) && (
                            <span className="afac-texto-gris">—</span>
                          )}
                        </span>
                      </td>
                      <td>
                        {facturaCompleta(f) ? (
                          <button
                            className="afac-ver-detalle"
                            onClick={() => navigate(`/admin/facturas/${f.id}`)}
                          >
                            Ver detalle
                          </button>
                        ) : (
                          <button
                            className="afac-btn-subir-factura"
                            onClick={() => navigate(`/admin/facturas/${f.id}/subir`)}
                          >
                            Subir Factura
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!cargando && registrosPagina.length === 0 && (
                    <tr>
                      <td colSpan={12} className="afac-sin-resultados">
                        No se encontraron facturas con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="afac-paginacion">
              <span className="afac-paginacion-resumen">
                Mostrando {facturasFiltradas.length === 0 ? 0 : indicePrimero + 1}
                {" - "}
                {Math.min(indiceUltimo, facturasFiltradas.length)} de {totalRegistros} registros
              </span>

              <div className="afac-paginacion-controles">
                <button
                  className="afac-paginacion-flecha"
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  aria-label="Página anterior"
                >
                  ‹
                </button>

                {paginasAMostrar.map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="afac-paginacion-puntos">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`afac-paginacion-numero ${p === paginaActual ? "afac-paginacion-numero--activo" : ""}`}
                      onClick={() => setPaginaActual(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="afac-paginacion-flecha"
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginasCliente))}
                  disabled={paginaActual === totalPaginasCliente}
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}