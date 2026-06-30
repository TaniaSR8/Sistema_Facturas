import React, { useState, useEffect } from 'react';
import '../css/ModalCambiarContrasena.css';

const ModalCambiarContrasena = ({ estaAbierto, alCerrar, alGuardar, politicas }) => {
  const [datosContrasena, setDatosContrasena] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });

  // Visibilidad independiente para cada campo de contraseña
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Limpiar el estado cuando se abre o cierra el modal
  useEffect(() => {
    if (estaAbierto) {
      setDatosContrasena({
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarContrasena: ''
      });
      setMostrarActual(false);
      setMostrarNueva(false);
      setMostrarConfirmar(false);
      setMensajeError('');
    }
  }, [estaAbierto]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setDatosContrasena(prev => ({ ...prev, [name]: value }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (cargando) return;

    // --- VALIDACIONES DE NIVEL FRONTEND ---
    const { contrasenaActual, nuevaContrasena, confirmarContrasena } = datosContrasena;

    if (!contrasenaActual) {
      setMensajeError("La contraseña actual es obligatoria.");
      return;
    }

    if (!nuevaContrasena) {
      setMensajeError("La nueva contraseña es obligatoria.");
      return;
    }

    // Obtener políticas dinámicas o usar defaults
    const {
      longitudMinima = 8,
      longitudMaxima = 16,
      minNumeros = 1,
      minEspeciales = 1,
      minMayusculas = 1,
      minMinusculas = 1
    } = politicas || {};

    if (nuevaContrasena.length < longitudMinima) {
      setMensajeError(`La nueva contraseña debe tener al menos ${longitudMinima} caracteres.`);
      return;
    }

    if (nuevaContrasena.length > longitudMaxima) {
      setMensajeError(`La nueva contraseña no puede exceder los ${longitudMaxima} caracteres.`);
      return;
    }

    // Contar tipos de caracteres
    const numMinusculas = (nuevaContrasena.match(/[a-z]/g) || []).length;
    const numMayusculas = (nuevaContrasena.match(/[A-Z]/g) || []).length;
    const numNumeros = (nuevaContrasena.match(/[0-9]/g) || []).length;
    const numEspeciales = (nuevaContrasena.match(/[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\};':",\.<>\/\?\\|`~]/g) || []).length;

    if (numMinusculas < minMinusculas) {
      setMensajeError(`La nueva contraseña debe incluir al menos ${minMinusculas} letra(s) minúscula(s).`);
      return;
    }
    if (numMayusculas < minMayusculas) {
      setMensajeError(`La nueva contraseña debe incluir al menos ${minMayusculas} letra(s) mayúscula(s).`);
      return;
    }
    if (numNumeros < minNumeros) {
      setMensajeError(`La nueva contraseña debe incluir al menos ${minNumeros} número(s).`);
      return;
    }
    if (numEspeciales < minEspeciales) {
      setMensajeError(`La nueva contraseña debe incluir al menos ${minEspeciales} carácter(es) especial(es) (ej. !, @, #, $).`);
      return;
    }

    if (nuevaContrasena === contrasenaActual) {
      setMensajeError("La nueva contraseña no puede ser idéntica a la contraseña actual.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeError("Las contraseñas nuevas no coinciden.");
      return;
    }
    // ----------------------------------------

    setCargando(true);
    setMensajeError('');

    try {
      if (alGuardar) {
        await alGuardar(datosContrasena);
      }
      alCerrar();
    } catch (error) {
      setMensajeError(error.message || 'Error al cambiar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  if (!estaAbierto) return null;

  // Iconos SVG para el ojo (Mostrar / Ocultar)
  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="cambiar-contrasena-overlay">
      <div className="cambiar-contrasena-content">
        <div className="modal-header">
          <h2>Cambiar Contraseña</h2>
        </div>

        <form onSubmit={manejarEnvio}>
          {mensajeError && <div className="error-message-modal">{mensajeError}</div>}

          <div className="grupo-formulario">
            <label htmlFor="contrasenaActual">Contraseña actual</label>
            <div className="password-input-container">
              <input
                id="contrasenaActual"
                type={mostrarActual ? "text" : "password"}
                name="contrasenaActual"
                value={datosContrasena.contrasenaActual}
                onChange={manejarCambio}
                placeholder="••••••••"
                required
                disabled={cargando}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarActual(!mostrarActual)}
                disabled={cargando}
                title={mostrarActual ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarActual ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="grupo-formulario">
            <label htmlFor="nuevaContrasena">Nueva contraseña</label>
            <div className="password-input-container">
              <input
                id="nuevaContrasena"
                type={mostrarNueva ? "text" : "password"}
                name="nuevaContrasena"
                value={datosContrasena.nuevaContrasena}
                onChange={manejarCambio}
                placeholder="Debe cumplir las políticas definidas"
                required
                disabled={cargando}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarNueva(!mostrarNueva)}
                disabled={cargando}
                title={mostrarNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarNueva ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="grupo-formulario">
            <label htmlFor="confirmarContrasena">Confirmar nueva contraseña</label>
            <div className="password-input-container">
              <input
                id="confirmarContrasena"
                type={mostrarConfirmar ? "text" : "password"}
                name="confirmarContrasena"
                value={datosContrasena.confirmarContrasena}
                onChange={manejarCambio}
                placeholder="Repetir nueva contraseña"
                required
                disabled={cargando}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                disabled={cargando}
                title={mostrarConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarConfirmar ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="caja-info-contrasena">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              La contraseña debe tener entre {politicas?.longitudMinima || 8} y {politicas?.longitudMaxima || 16} caracteres, incluir al menos: {politicas?.minMayusculas || 1} mayúscula(s), {politicas?.minMinusculas || 1} minúscula(s), {politicas?.minNumeros || 1} número(s) y {politicas?.minEspeciales || 1} carácter(es) especial(es) (ej. !, @, #, $).
            </span>
          </div>

          <div className="acciones-modal">
            <button 
              type="button" 
              className="boton-cancelar" 
              onClick={alCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="boton-guardar"
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCambiarContrasena;