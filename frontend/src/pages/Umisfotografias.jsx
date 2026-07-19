import { useNavigate } from "react-router-dom";
import api from "../axios";
import "../css/UMisFotografias.css";
import React, { useState, useEffect, useCallback } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";


import ModalSubirFactura from "../components/ModalSubirFactura";


const TIPOS_GASTO_RESPALDO = [{ valor: "", etiqueta: "Todos los tipos" }];
const REGISTROS_POR_PAGINA = 5;

const formatoMoneda = (valor) =>
  valor == null
    ? "—"
    : Number(valor).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatoFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export default function UMisFotografias() {
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

  // Filtros
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [tipoGastoFiltro, setTipoGastoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tiposGasto, setTiposGasto] = useState(TIPOS_GASTO_RESPALDO);

  // Datos
  const [fotos, setFotos] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // Checkbox: guardando por fila
  const [guardandoId, setGuardandoId] = useState(null);

  // ---------- Modal de Subir Factura (se abre al hacer clic en la miniatura) ----------
  const [fotoParaSubir, setFotoParaSubir] = useState(null); // formato "p-<id>", igual que espera el modal

  const abrirModalSubirFactura = (foto) => {
    if (foto.facturaVinculada) return; // ya tiene factura real, no dejamos volver a subir
    setFotoParaSubir(`p-${foto.id}`);
  };

  const cerrarModalSubirFactura = () => setFotoParaSubir(null);

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
        console.warn("No se pudo cargar el catálogo de tipos de gasto.", err);
      }
    };
    cargarTiposGasto();
  }, []);

  const cargarFotos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const usuarioId = localStorage.getItem("usuarioId");
      const { data } = await api.get("/fotos/historial", {
        params: {
          usuarioId,
          desde: fechaFiltro || undefined,
          tipoGasto: tipoGastoFiltro || undefined,
          estado: estadoFiltro || undefined,
          pagina: paginaActual,
          porPagina: REGISTROS_POR_PAGINA,
        },
      });
      setFotos(Array.isArray(data?.fotos) ? data.fotos : []);
      setTotalRegistros(data?.total ?? 0);
    } catch (err) {
      console.error("Error al cargar historial de fotos:", err);
      setError("No se pudo cargar tu historial de fotografías.");
      addToast("No se pudo cargar tu historial de fotografías.", "error");
      setFotos([]);
      setTotalRegistros(0);
    } finally {
      setCargando(false);
    }
  }, [fechaFiltro, tipoGastoFiltro, estadoFiltro, paginaActual]);

  useEffect(() => {
    cargarFotos();
  }, [cargarFotos]);

  const aplicarFiltros = () => {
    setPaginaActual(1);
    cargarFotos();
  };

  const alternarSubidoManual = async (foto) => {
    if (foto.facturaVinculada) return; // bloqueado: ya está vinculada de verdad
    setGuardandoId(foto.id);
    try {
      await api.put(`/fotos/${foto.id}/subido-manual`, {
        subidoManual: !foto.subidoManual,
      });
      setFotos((prev) =>
        prev.map((f) =>
          f.id === foto.id
            ? {
                ...f,
                subidoManual: !f.subidoManual,
                estado: !f.subidoManual ? "FACTURADO" : "NO FACTURADO",
              }
            : f
        )
      );
      addToast("Fotografía actualizada correctamente.", "success");
    } catch (err) {
      console.error("Error al actualizar el checkbox:", err);
      setError("No se pudo actualizar esa fotografía. Intenta de nuevo.");
      addToast("No se pudo actualizar esa fotografía. Intenta de nuevo.", "error");
    } finally {
      setGuardandoId(null);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA));

  return (
    <div className="panel-container">
      {/* ---------- Sidebar ---------- */}
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
            <div className="menu-icon inicio"></div>
            Inicio
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/factura")}>
            <div className="menu-icon facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/dashboard")}>
  <div className="menu-icon dashboard"></div>
  Dashboard
</button>
          <button className="menu-item active">
            <div className="menu-icon fotos"></div>
            Mis Fotografías
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/perfil")}>
            <div className="menu-icon perfil"></div>
            Mi Perfil
          </button>
        </nav>
        <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
          <div className="logout-icon"></div>
          Cerrar Sesión
        </button>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar"></div>

        <main className="panel-main">
          <h1 className="umf-titulo">Mis Fotografías</h1>

          {error && <div className="umf-alerta umf-alerta--error">{error}</div>}

          {/* ---------- Filtros ---------- */}
          <section className="umf-filtros">
            <div className="umf-filtro">
              <label>Rango de Fechas</label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
              />
            </div>

            <div className="umf-filtro">
              <label>Tipo de Gasto</label>
              <select value={tipoGastoFiltro} onChange={(e) => setTipoGastoFiltro(e.target.value)}>
                {tiposGasto.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="umf-filtro">
              <label>Estado</label>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="">Cualquier estado</option>
                <option value="FACTURADO">Facturado</option>
                <option value="NO FACTURADO">No facturado</option>
              </select>
            </div>

            <button className="umf-btn-filtrar" onClick={aplicarFiltros}>
              ⚲ Aplicar Filtros
            </button>
          </section>

          {/* ---------- Tabla ---------- */}
          <section className="umf-tabla-section">
            <div className="umf-tabla-responsive">
              <table className="umf-tabla">
                <thead>
                  <tr>
                    <th>FOTOGRAFÍA</th>
                    <th>FECHA</th>
                    <th>CONCEPTO / RAZÓN SOCIAL</th>
                    <th>TIPO DE GASTO</th>
                    <th>MONTO</th>
                    <th>DEDUCIBLE</th>
                    <th>ESTADO</th>
                    <th>SUBIDO</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando && (
                    <tr>
                      <td colSpan={8} className="umf-sin-resultados">
                        Cargando...
                      </td>
                    </tr>
                  )}

                  {!cargando && fotos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="umf-sin-resultados">
                        No se encontraron fotografías con esos filtros.
                      </td>
                    </tr>
                  )}

                  {!cargando &&
                    fotos.map((foto) => (
                      <tr key={foto.id}>
                        <td>
                          <img
                            src={foto.fotoUrl}
                            alt="Ticket"
                            className="umf-miniatura"
                            onClick={() => abrirModalSubirFactura(foto)}
                            style={{
                              cursor: foto.facturaVinculada ? "default" : "pointer",
                              opacity: foto.facturaVinculada ? 0.85 : 1,
                            }}
                            title={
                              foto.facturaVinculada
                                ? "Esta fotografía ya tiene una factura vinculada"
                                : "Clic para subir la factura de este comprobante"
                            }
                          />
                        </td>
                        <td className="umf-texto-gris">{formatoFecha(foto.fecha)}</td>
                        <td>
                          <span className="umf-concepto">{foto.concepto}</span>
                        </td>
                        <td className="umf-texto-gris">{foto.tipoGasto}</td>
                        <td className="umf-monto">{formatoMoneda(foto.monto)}</td>
                        <td>{foto.deducible}</td>
                        <td>
                          <span
                            className={`umf-badge-estado ${
                              foto.estado === "FACTURADO"
                                ? "umf-badge-estado--facturado"
                                : "umf-badge-estado--no-facturado"
                            }`}
                          >
                            {foto.estado}
                          </span>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            className="umf-checkbox"
                            checked={foto.facturaVinculada || foto.subidoManual}
                            disabled={foto.facturaVinculada || guardandoId === foto.id}
                            onChange={() => alternarSubidoManual(foto)}
                            title={
                              foto.facturaVinculada
                                ? "Vinculada automáticamente a una factura"
                                : "Marca si ya la facturaste por tu cuenta"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="umf-paginacion">
              <span className="umf-paginacion-resumen">
                Mostrando{" "}
                {totalRegistros === 0
                  ? 0
                  : (paginaActual - 1) * REGISTROS_POR_PAGINA + 1}
                {" - "}
                {Math.min(paginaActual * REGISTROS_POR_PAGINA, totalRegistros)} de {totalRegistros}{" "}
                fotografías
              </span>

              <div className="umf-paginacion-controles">
                <button
                  className="umf-paginacion-flecha"
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                >
                  ‹
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((p) => (
                    <button
                      key={p}
                      className={`umf-paginacion-numero ${
                        p === paginaActual ? "umf-paginacion-numero--activo" : ""
                      }`}
                      onClick={() => setPaginaActual(p)}
                    >
                      {p}
                    </button>
                  ))}
                {totalPaginas > 5 && <span className="umf-paginacion-puntos">…</span>}
                <button
                  className="umf-paginacion-siguiente"
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
      <ModalCerrarSesion 
        isOpen={modalCerrarSesionAbierto} 
        onClose={() => setModalCerrarSesionAbierto(false)} 
        onConfirm={handleCerrarSesion} 
      />

      {fotoParaSubir && (
        <ModalSubirFactura
          idParam={fotoParaSubir}
          onClose={cerrarModalSubirFactura}
          onExito={cargarFotos}
        />
      )}
    </div>
  );
}