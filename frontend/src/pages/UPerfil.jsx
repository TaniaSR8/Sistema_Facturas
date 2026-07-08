import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/UPerfil.css";
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

// Iconos SVG para los info-box / botones (estos sí funcionan bien con
// currentColor porque están dentro de contenedores que ya definen su color)
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

export default function UPerfil() {
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

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Formularios
  const [mostrarActualizar, setMostrarActualizar] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [datosForm, setDatosForm] = useState({ nombre: "", correo: "", telefono: "" });
  const [passwordForm, setPasswordForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [guardando, setGuardando] = useState(false);

  // Estados para controlar los nuevos modales
  const [modalActualizarAbierto, setModalActualizarAbierto] = useState(false);
  const [modalContrasenaAbierto, setModalContrasenaAbierto] = useState(false);

  // Callbacks preparados para que conectes el backend/API de los modales más adelante
  const alGuardarActualizar = async (datosUsuario) => {
    console.log("Guardar datos del modal (preparado):", datosUsuario);
    /*
    try {
      await api.put("/perfil/actualizar", {
        nombre: datosUsuario.nombreCompleto,
        correo: datosUsuario.correo,
        telefono: datosUsuario.telefono,
        estado: datosUsuario.estado,
        numeroEmpleado: datosUsuario.numeroEmpleado,
      });
      setPerfil((prev) => ({
        ...prev,
        nombre: datosUsuario.nombreCompleto,
        correo: datosUsuario.correo,
        telefono: datosUsuario.telefono,
        estado: datosUsuario.estado
      }));
      addToast("Datos actualizados correctamente.", "success");
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      addToast(msg, "error");
      throw err;
    }
    */
  };

  const alGuardarContrasena = async (datosContrasena) => {
    console.log("Cambiar contraseña del modal (preparado):", datosContrasena);
    /*
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
    */
  };

  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      setError("");
      try {
        const usuarioId = localStorage.getItem("usuarioId");
        const { data } = await api.get("/perfil", { params: { usuarioId } });
        setPerfil(data);
        setDatosForm({
          nombre: data.nombre || "",
          correo: data.correo || "",
          telefono: data.telefono || "",
        });
      } catch (err) {
        const msg = obtenerMensajeErrorApi(err);
        setError(msg);
        addToast(msg, "error");
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, []);

  const nombreCompleto = perfil
    ? [perfil.nombre, perfil.apellidoPaterno, perfil.apellidoMaterno].filter(Boolean).join(" ")
    : "";

  const manejarActualizarDatos = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setGuardando(true);
    try {
      await api.put("/perfil/actualizar", {
        nombre: datosForm.nombre,
        correo: datosForm.correo,
        telefono: datosForm.telefono,
        estado: perfil.estado,
        numeroEmpleado: perfil.numeroEmpleado,
      });
      setPerfil((prev) => ({ ...prev, ...datosForm }));
      setExito("Datos actualizados correctamente.");
      addToast("Datos actualizados correctamente.", "success");
      setMostrarActualizar(false);
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      setError(msg);
      addToast(msg, "error");
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarContrasena = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (passwordForm.nueva !== passwordForm.confirmar) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      addToast("La nueva contraseña y su confirmación no coinciden.", "error");
      return;
    }

    setGuardando(true);
    try {
      await api.put("/perfil/cambiar-contrasena", {
        correo: perfil.correo,
        contrasenaActual: passwordForm.actual,
        nuevaContrasena: passwordForm.nueva,
      });
      setExito("Contraseña actualizada correctamente.");
      addToast("Contraseña actualizada correctamente.", "success");
      setPasswordForm({ actual: "", nueva: "", confirmar: "" });
      setMostrarContrasena(false);
    } catch (err) {
      const msg = obtenerMensajeErrorApi(err);
      setError(msg);
      addToast(msg, "error");
    } finally {
      setGuardando(false);
    }
  };

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
            <span className="menu-icon inicio" />
            Inicio
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/factura")}>
            <span className="menu-icon facturas" />
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/dashboard")}>
            <span className="menu-icon dashboard" />
            Dashboard
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/mis-fotografias")}>
            <span className="menu-icon fotos" />
            Mis Fotografías
          </button>
          <button className="menu-item active">
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
        <div className="top-blue-bar uperfil-topbar">
          <span className="uperfil-topbar-icono">
            <div className="uperfil-icon-header"></div>
          </span>
          <h1 className="uperfil-topbar-titulo">Mi Perfil</h1>
        </div>

        <main className="panel-main">
          {error && <div className="uperfil-alerta uperfil-alerta--error">{error}</div>}
          {exito && <div className="uperfil-alerta uperfil-alerta--exito">{exito}</div>}

          {cargando && <div className="uperfil-cargando">Cargando perfil...</div>}

          {!cargando && perfil && (
            <>
              {/* Tarjeta principal: nombre + badge de rol */}
              <div className="uperfil-card uperfil-card--nombre">
                <h2 className="uperfil-nombre">{nombreCompleto}</h2>
                <span className="uperfil-badge-rol">Usuario</span>
              </div>

              {/* Fila 1: número de empleado / correo */}
              <div className="uperfil-grid">
                <div className="uperfil-info-card">
                  <div className="uperfil-info-icono">
                    <IconBadge />
                  </div>
                  <div className="uperfil-info-texto">
                    <span className="uperfil-info-etiqueta">Número de empleado</span>
                    <span className="uperfil-info-valor">{perfil.numeroEmpleado}</span>
                  </div>
                </div>

                <div className="uperfil-info-card">
                  <div className="uperfil-info-icono">
                    <IconAt />
                  </div>
                  <div className="uperfil-info-texto">
                    <span className="uperfil-info-etiqueta">Correo institucional</span>
                    <span className="uperfil-info-valor">{perfil.correo}</span>
                  </div>
                </div>
              </div>

              {/* Fila 2: estado de cuenta / fecha de creación */}
              <div className="uperfil-grid">
                <div className="uperfil-info-card uperfil-info-card--con-indicador">
                  <div className="uperfil-info-card-header">
                    <span className="uperfil-info-etiqueta">Estado de cuenta</span>
                    <span className="uperfil-indicador-icono uperfil-indicador-icono--ok">
                      <IconCheckCircle />
                    </span>
                  </div>
                  <div className="uperfil-estado-valor">
                    <span
                      className={`uperfil-punto ${
                        perfil.estado === "ACTIVO" ? "uperfil-punto--activo" : "uperfil-punto--inactivo"
                      }`}
                    />
                    {perfil.estado === "ACTIVO" ? "Activa" : "Inactiva"}
                  </div>
                </div>

                <div className="uperfil-info-card uperfil-info-card--con-indicador">
                  <div className="uperfil-info-card-header">
                    <span className="uperfil-info-etiqueta">Fecha de creación</span>
                    <span className="uperfil-indicador-icono">
                      <IconCalendar />
                    </span>
                  </div>
                  <div className="uperfil-estado-valor">
                    {formatoFecha(perfil.fechaCreacion)}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="uperfil-acciones">
                <button
                  className="uperfil-btn uperfil-btn--primario"
                  onClick={() => setModalActualizarAbierto(true)}
                >
                  <IconEdit />
                  Actualizar Datos
                </button>
                <button
                  className="uperfil-btn uperfil-btn--primario"
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
        politicas={{
          longitudMinima: 8,
          longitudMaxima: 16,
          minNumeros: 1,
          minEspeciales: 1,
          minMayusculas: 1,
          minMinusculas: 1
        }}
      />
    </div>
  );
}