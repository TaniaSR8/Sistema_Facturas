import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/Perfiladministrador.css";
import React, { useState, useEffect } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import ModalActualizarDatos from "../components/ModalActualizarDatos";
import ModalCambiarContrasena from "../components/ModalCambiarContrasena";
import { useToast } from "../components/Toast";

const formatoFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ---------------------------------------------------------------------------
// Íconos SVG (mismo patrón que UPerfil.jsx)
// ---------------------------------------------------------------------------
const IconBadge = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M6 16c0-2 2-3 3-3s3 1 3 3" />
    <line x1="14" y1="9" x2="18" y2="9" />
    <line x1="14" y1="13" x2="18" y2="13" />
  </svg>
);

const IconAt = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);

const IconCheckCircle = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.707 9.293l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L10 14.586l4.293-4.293a1 1 0 111.414 1.414z" clipRule="evenodd" />
  </svg>
);

const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconLockReset = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
    <rect x="9" y="12" width="6" height="5" rx="1" />
    <path d="M10 12V10a2 2 0 1 1 4 0v2" />
  </svg>
);

export default function PerfilAdministrador() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [politicas, setPoliticas] = useState({
    longitudMinima: 8,
    longitudMaxima: 16,
    minNumeros: 1,
    minEspeciales: 1,
    minMayusculas: 1,
    minMinusculas: 1,
  });

  const [modalActualizarAbierto, setModalActualizarAbierto] = useState(false);
  const [modalContrasenaAbierto, setModalContrasenaAbierto] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate("/login");
  };

  // ---------- Carga inicial: perfil + políticas de contraseña ----------
  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      setError("");
      try {
        const usuarioId = localStorage.getItem("usuarioId");
        const { data } = await api.get("/perfil", { params: { usuarioId } });
        setPerfil(data);
      } catch (err) {
        const msg = obtenerMensajeErrorApi(err);
        setError(msg);
        addToast(msg, "error");
      } finally {
        setCargando(false);
      }
    };

    const cargarPoliticas = async () => {
      try {
        const { data } = await api.get("/politicas");
        if (data && data.politicas) {
          setPoliticas(data.politicas);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las políticas de contraseña, usando valores por defecto.", err);
      }
    };

    cargarPerfil();
    cargarPoliticas();
  }, []);

  const nombreCompleto = perfil
    ? [perfil.nombre, perfil.apellidoPaterno, perfil.apellidoMaterno].filter(Boolean).join(" ")
    : "";

  // ---------- Guardar datos (llamado por ModalActualizarDatos) ----------
  const alGuardarActualizar = async (datosUsuario) => {
    try {
      const { data } = await api.put("/perfil/actualizar", {
        nombre: datosUsuario.nombreCompleto,
        correo: datosUsuario.correo,
        telefono: datosUsuario.telefono,
        estado: perfil.estado, // el estado de cuenta no se toca desde este modal
        numeroEmpleado: perfil.numeroEmpleado,
      });

      setPerfil((prev) => ({
        ...prev,
        nombre: datosUsuario.nombreCompleto,
        correo: data.correo || datosUsuario.correo,
        telefono: datosUsuario.telefono,
      }));

      addToast("Datos actualizados correctamente.", "success");
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      addToast(msg, "error");
      throw err; // el modal necesita el throw para no cerrarse en caso de error
    }
  };

  // ---------- Cambiar contraseña (llamado por ModalCambiarContrasena) ----------
  const alGuardarContrasena = async (datosContrasena) => {
    try {
      await api.put("/perfil/cambiar-contrasena", {
        correo: perfil.correo,
        contrasenaActual: datosContrasena.contrasenaActual,
        nuevaContrasena: datosContrasena.nuevaContrasena,
      });
      addToast("Contraseña actualizada correctamente.", "success");
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      addToast(msg, "error");
      throw err;
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
            <div className="menu-icon pa-icono-facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/validaciones")}>
            <div className="menu-icon pa-icono-validaciones"></div>
            Validaciones
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-usuario")}>
            <div className="menu-icon pa-icono-reporte-usuario"></div>
            Reporte por Usuario
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reportes-global")}>
            <div className="menu-icon pa-icono-reportes-global"></div>
            Reportes Global
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-pendientes")}>
            <div className="menu-icon pa-icono-reporte-pendientes"></div>
            Reporte de Pendientes
          </button>
          <button className="menu-item" onClick={() => navigate("/admin/reporte-ventas-mes")}>
            <div className="menu-icon pa-icono-reporte-ventas"></div>
            Reporte de Ventas
          </button>
          <button className="menu-item active">
            <div className="menu-icon pa-icono-perfil"></div>
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
        <div className="top-blue-bar pa-topbar">
          <span className="pa-topbar-icono">
            <div className="pa-icon-header"></div>
          </span>
          <h1 className="pa-topbar-titulo">Mi Perfil</h1>
        </div>

        <main className="panel-main">
          {error && <div className="pa-alerta pa-alerta--error">{error}</div>}

          {cargando && <div className="pa-cargando">Cargando perfil...</div>}

          {!cargando && perfil && (
            <>
              {/* Tarjeta principal: nombre + badge de rol */}
              <div className="pa-card pa-card--nombre">
                <h2 className="pa-nombre">{nombreCompleto}</h2>
                <span className="pa-badge-rol">Administrador</span>
              </div>

              {/* Fila 1: número de empleado / correo */}
              <div className="pa-grid">
                <div className="pa-info-card">
                  <div className="pa-info-icono">
                    <IconBadge />
                  </div>
                  <div className="pa-info-texto">
                    <span className="pa-info-etiqueta">Número de empleado</span>
                    <span className="pa-info-valor">{perfil.numeroEmpleado}</span>
                  </div>
                </div>

                <div className="pa-info-card">
                  <div className="pa-info-icono">
                    <IconAt />
                  </div>
                  <div className="pa-info-texto">
                    <span className="pa-info-etiqueta">Correo institucional</span>
                    <span className="pa-info-valor">{perfil.correo}</span>
                  </div>
                </div>
              </div>

              {/* Fila 2: estado de cuenta / fecha de creación */}
              <div className="pa-grid">
                <div className="pa-info-card pa-info-card--con-indicador">
                  <div className="pa-info-card-header">
                    <span className="pa-info-etiqueta">Estado de cuenta</span>
                    <span className="pa-indicador-icono pa-indicador-icono--ok">
                      <IconCheckCircle />
                    </span>
                  </div>
                  <div className="pa-estado-valor">
                    <span
                      className={`pa-punto ${
                        perfil.estado === "ACTIVO" ? "pa-punto--activo" : "pa-punto--inactivo"
                      }`}
                    />
                    {perfil.estado === "ACTIVO" ? "Activa" : "Inactiva"}
                  </div>
                </div>

                <div className="pa-info-card pa-info-card--con-indicador">
                  <div className="pa-info-card-header">
                    <span className="pa-info-etiqueta">Fecha de creación</span>
                    <span className="pa-indicador-icono">
                      <IconCalendar />
                    </span>
                  </div>
                  <div className="pa-estado-valor">{formatoFecha(perfil.fechaCreacion)}</div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pa-acciones">
                <button
                  className="pa-btn pa-btn--primario"
                  onClick={() => setModalActualizarAbierto(true)}
                >
                  <IconEdit />
                  Actualizar Datos
                </button>
                <button
                  className="pa-btn pa-btn--primario"
                  onClick={() => setModalContrasenaAbierto(true)}
                >
                  <IconLockReset />
                  Cambiar Contraseña
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      <ModalCerrarSesion
        isOpen={modalCerrarSesionAbierto}
        onClose={() => setModalCerrarSesionAbierto(false)}
        onConfirm={handleCerrarSesion}
      />

      <ModalActualizarDatos
        estaAbierto={modalActualizarAbierto}
        alCerrar={() => setModalActualizarAbierto(false)}
        datosIniciales={
          perfil
            ? {
                ...perfil,
                nombre: nombreCompleto,
                fechaCreacion: formatoFecha(perfil.fechaCreacion),
              }
            : null
        }
        alGuardar={alGuardarActualizar}
      />

      <ModalCambiarContrasena
        estaAbierto={modalContrasenaAbierto}
        alCerrar={() => setModalContrasenaAbierto(false)}
        alGuardar={alGuardarContrasena}
        politicas={politicas}
      />
    </div>
  );
}