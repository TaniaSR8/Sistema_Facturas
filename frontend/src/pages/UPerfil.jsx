import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/UPerfil.css";
import React, { useState, useEffect } from "react";

const formatoFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function UPerfil() {
  const navigate = useNavigate();

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
        setError(obtenerMensajeErrorApi(err));
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
      setMostrarActualizar(false);
    } catch (err) {
      setError(obtenerMensajeErrorApi(err));
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
      setPasswordForm({ actual: "", nueva: "", confirmar: "" });
      setMostrarContrasena(false);
    } catch (err) {
      setError(obtenerMensajeErrorApi(err));
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
        <button className="sidebar-logout" onClick={() => navigate("/login")}>
          <span className="logout-icon" />
          Cerrar Sesión
        </button>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar uperfil-topbar">
          <span className="uperfil-topbar-icono">
            <span className="material-symbols-outlined">account_circle</span>
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
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div className="uperfil-info-texto">
                    <span className="uperfil-info-etiqueta">Número de empleado</span>
                    <span className="uperfil-info-valor">{perfil.numeroEmpleado}</span>
                  </div>
                </div>

                <div className="uperfil-info-card">
                  <div className="uperfil-info-icono">
                    <span className="material-symbols-outlined">mail</span>
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
                      <span className="material-symbols-outlined">check_circle</span>
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
                      <span className="material-symbols-outlined">calendar_month</span>
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
                  onClick={() => {
                    setMostrarActualizar((prev) => !prev);
                    setMostrarContrasena(false);
                  }}
                >
                  <span className="material-symbols-outlined">edit</span>
                  Actualizar Datos
                </button>
                <button
                  className="uperfil-btn uperfil-btn--primario"
                  onClick={() => {
                    setMostrarContrasena((prev) => !prev);
                    setMostrarActualizar(false);
                  }}
                >
                  <span className="material-symbols-outlined">lock_reset</span>
                  Cambiar Contraseña
                </button>
              </div>

              {/* Formulario: Actualizar Datos */}
              {mostrarActualizar && (
                <form className="uperfil-form-card" onSubmit={manejarActualizarDatos}>
                  <h3 className="uperfil-form-titulo">Actualizar datos</h3>
                  <div className="uperfil-form-grid">
                    <div className="uperfil-campo">
                      <label>Nombre completo</label>
                      <input
                        type="text"
                        value={datosForm.nombre}
                        onChange={(e) => setDatosForm({ ...datosForm, nombre: e.target.value })}
                      />
                    </div>
                    <div className="uperfil-campo">
                      <label>Correo</label>
                      <input
                        type="email"
                        value={datosForm.correo}
                        onChange={(e) => setDatosForm({ ...datosForm, correo: e.target.value })}
                      />
                    </div>
                    <div className="uperfil-campo">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        value={datosForm.telefono}
                        onChange={(e) => setDatosForm({ ...datosForm, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="uperfil-form-acciones">
                    <button
                      type="button"
                      className="uperfil-btn uperfil-btn--secundario"
                      onClick={() => setMostrarActualizar(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="uperfil-btn uperfil-btn--primario" disabled={guardando}>
                      {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              )}

              {/* Formulario: Cambiar Contraseña */}
              {mostrarContrasena && (
                <form className="uperfil-form-card" onSubmit={manejarCambiarContrasena}>
                  <h3 className="uperfil-form-titulo">Cambiar contraseña</h3>
                  <div className="uperfil-form-grid">
                    <div className="uperfil-campo">
                      <label>Contraseña actual</label>
                      <input
                        type="password"
                        value={passwordForm.actual}
                        onChange={(e) => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                      />
                    </div>
                    <div className="uperfil-campo">
                      <label>Nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.nueva}
                        onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                      />
                    </div>
                    <div className="uperfil-campo">
                      <label>Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        value={passwordForm.confirmar}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="uperfil-form-acciones">
                    <button
                      type="button"
                      className="uperfil-btn uperfil-btn--secundario"
                      onClick={() => setMostrarContrasena(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="uperfil-btn uperfil-btn--primario" disabled={guardando}>
                      {guardando ? "Guardando..." : "Cambiar contraseña"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}