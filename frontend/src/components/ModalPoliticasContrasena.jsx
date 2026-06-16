import React, { useState, useEffect } from 'react';
import '../css/ModalPoliticasContrasena.css';

const ModalPoliticasContrasena = ({ estaAbierto, alCerrar, politicasIniciales, alGuardar }) => {
  const [politicas, setPoliticas] = useState({
    longitudMinima: '',
    longitudMaxima: '',
    minNumeros: '',
    minEspeciales: '',
    minMayusculas: '',
    minMinusculas: ''
  });

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Sincronizar el estado cuando cambien las políticas iniciales o se abra el modal
  useEffect(() => {
    if (estaAbierto && politicasIniciales) {
      setPoliticas({
        longitudMinima: politicasIniciales.longitudMinima || '',
        longitudMaxima: politicasIniciales.longitudMaxima || '',
        minNumeros: politicasIniciales.minNumeros || '',
        minEspeciales: politicasIniciales.minEspeciales || '',
        minMayusculas: politicasIniciales.minMayusculas || '',
        minMinusculas: politicasIniciales.minMinusculas || ''
      });
      setMensajeError('');
    }
  }, [estaAbierto, politicasIniciales]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    // Asegurarse de que el valor sea un número no negativo
    const numero = Math.max(0, parseInt(value, 10) || 0);
    setPoliticas(prev => ({ ...prev, [name]: numero }));
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    if (cargando) return;

    // --- VALIDACIONES DE NIVEL FRONTEND ---
    const { longitudMinima, longitudMaxima, minNumeros, minEspeciales, minMayusculas, minMinusculas } = politicas;

    if (longitudMinima <= 0) {
      setMensajeError("La longitud mínima de la contraseña debe ser mayor a 0.");
      return;
    }

    if (longitudMaxima < longitudMinima) {
      setMensajeError("La longitud máxima no puede ser menor a la longitud mínima.");
      return;
    }

    if (minNumeros < 0 || minEspeciales < 0 || minMayusculas < 0 || minMinusculas < 0) {
      setMensajeError("Los requisitos mínimos no pueden ser valores negativos.");
      return;
    }
    // ----------------------------------------

    setCargando(true);
    setMensajeError('');

    try {
      if (alGuardar) {
        await alGuardar(politicas);
      }
      alCerrar();
    } catch (error) {
      setMensajeError(error.message || 'Error al guardar la configuración.');
    } finally {
      setCargando(false);
    }
  };

  if (!estaAbierto) return null;

  // Iconos SVG para los labels
  const KeyboardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="label-icon">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M10 12h.01M14 12h.01M7 16h10" />
    </svg>
  );

  const CheckboxIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="label-icon">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );

  return (
    <div className="politicas-contrasena-overlay">
      <div className="politicas-contrasena-content">
        <div className="modal-header">
          <h2>Políticas de Contraseña</h2>
        </div>

        <form onSubmit={guardarConfiguracion}>
          <div className="brand-section">
            <h1 className="brand-title">Políticas de Contraseña</h1>
            <p className="descripcion">Defina los requisitos de seguridad para las cuentas del Sistema de Control de Facturas.</p>
          </div>

          {mensajeError && <div className="error-message-modal">{mensajeError}</div>}

          <div className="grupo-formulario">
            <label htmlFor="longitudMinima">
              <KeyboardIcon />
              Longitud mínima de contraseña
            </label>
            <input
              id="longitudMinima"
              type="number"
              name="longitudMinima"
              value={politicas.longitudMinima}
              onChange={manejarCambio}
              min="1"
              required
              disabled={cargando}
            />
            <small className="helper-text">* El valor debe ser mayor a 0.</small>
          </div>

          <div className="grupo-formulario">
            <label htmlFor="longitudMaxima">
              <CheckboxIcon />
              Longitud máxima de contraseña
            </label>
            <input
              id="longitudMaxima"
              type="number"
              name="longitudMaxima"
              value={politicas.longitudMaxima}
              onChange={manejarCambio}
              min="1"
              required
              disabled={cargando}
            />
          </div>

          <div className="fila-doble">
            <div className="grupo-formulario">
              <label htmlFor="minNumeros">Cantidad mínima de números</label>
              <input
                id="minNumeros"
                type="number"
                name="minNumeros"
                value={politicas.minNumeros}
                onChange={manejarCambio}
                min="0"
                required
                disabled={cargando}
              />
            </div>
            <div className="grupo-formulario">
              <label htmlFor="minEspeciales">Cantidad mínima de caracteres especiales</label>
              <input
                id="minEspeciales"
                type="number"
                name="minEspeciales"
                value={politicas.minEspeciales}
                onChange={manejarCambio}
                min="0"
                required
                disabled={cargando}
              />
            </div>
          </div>

          <div className="fila-doble">
            <div className="grupo-formulario">
              <label htmlFor="minMayusculas">Cantidad mínima de letras mayúsculas</label>
              <input
                id="minMayusculas"
                type="number"
                name="minMayusculas"
                value={politicas.minMayusculas}
                onChange={manejarCambio}
                min="0"
                required
                disabled={cargando}
              />
            </div>
            <div className="grupo-formulario">
              <label htmlFor="minMinusculas">Cantidad mínima de letras minúsculas</label>
              <input
                id="minMinusculas"
                type="number"
                name="minMinusculas"
                value={politicas.minMinusculas}
                onChange={manejarCambio}
                min="0"
                required
                disabled={cargando}
              />
            </div>
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
              {cargando ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalPoliticasContrasena;