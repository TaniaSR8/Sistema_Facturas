import React, { useState, useEffect } from 'react';
import '../css/ModalActualizarDatos.css';

const ModalActualizarDatos = ({ estaAbierto, alCerrar, datosIniciales, alGuardar }) => {
  // Estado para manejar los datos del formulario
  const [datosUsuario, setDatosUsuario] = useState({
    nombreCompleto: '',
    correo: '',
    estado: 'Activo',
    telefono: '',
    numeroEmpleado: '',
    fechaCreacion: ''
  });

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Sincronizar el estado local cuando cambien los datos iniciales o se abra el modal
  useEffect(() => {
    if (estaAbierto && datosIniciales) {
      setDatosUsuario({
        nombreCompleto: datosIniciales.nombre || '',
        correo: datosIniciales.correo || '',
        estado: datosIniciales.estado || 'Activo',
        telefono: datosIniciales.telefono || '',
        numeroEmpleado: datosIniciales.numeroEmpleado || '',
        fechaCreacion: datosIniciales.fechaCreacion || ''
      });
      setMensajeError('');
    }
  }, [estaAbierto, datosIniciales]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    // Validación del teléfono: solo números y límite de 10 caracteres
    if (name === 'telefono') {
      const soloNumeros = value.replace(/[^0-9]/g, '');
      setDatosUsuario(prev => ({ ...prev, [name]: soloNumeros.slice(0, 10) }));
    } else {
      setDatosUsuario(prev => ({ ...prev, [name]: value }));
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (cargando) return;

    // --- VALIDACIONES DE NIVEL FRONTEND ---
    const nombreTrim = datosUsuario.nombreCompleto.trim();
    const correoTrim = datosUsuario.correo.trim();

    if (!nombreTrim) {
      setMensajeError("El nombre completo es obligatorio.");
      return;
    }

    if (nombreTrim.length < 3) {
      setMensajeError("El nombre completo debe tener al menos 3 caracteres.");
      return;
    }

    // Permitir letras, espacios y acentos
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nombreRegex.test(nombreTrim)) {
      setMensajeError("El nombre completo solo debe contener letras y espacios.");
      return;
    }

    if (!correoTrim) {
      setMensajeError("El correo electrónico es obligatorio.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoTrim)) {
      setMensajeError("El formato del correo electrónico no es válido.");
      return;
    }

    if (datosUsuario.telefono && datosUsuario.telefono.length > 0 && datosUsuario.telefono.length !== 10) {
      setMensajeError("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    // ----------------------------------------

    setCargando(true);
    setMensajeError('');

    try {
      if (alGuardar) {
        await alGuardar(datosUsuario);
      }
      alCerrar();
    } catch (error) {
      setMensajeError(error.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setCargando(false);
    }
  };

  if (!estaAbierto) return null;

  return (
    <div className="actualizar-datos-overlay">
      <div className="actualizar-datos-content">
        <div className="modal-header">
          <h2>Actualizar Datos</h2>
        </div>
        
        <form onSubmit={manejarEnvio}>
          {mensajeError && <div className="error-message-modal">{mensajeError}</div>}
          
          <div className="form-group full-width">
            <label htmlFor="nombreCompleto">Nombre Completo*</label>
            <input
              id="nombreCompleto"
              name="nombreCompleto"
              type="text"
              value={datosUsuario.nombreCompleto}
              onChange={manejarCambio}
              placeholder="Ej. Nombre ...."
              required
              disabled={cargando}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="correo">Correo*</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={datosUsuario.correo}
              onChange={manejarCambio}
              placeholder="Ej. nombre@ejemplo.com"
              required
              disabled={cargando}
            />
          </div>

          <div className="row">
            <div className="form-group">
              <label htmlFor="estado">Estado de la Cuenta*</label>
              <div className="select-container">
                <select
                  id="estado"
                  name="estado"
                  value={datosUsuario.estado}
                  onChange={manejarCambio}
                  disabled={cargando}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="telefono">Telefono *</label>
              <input
                id="telefono"
                name="telefono"
                type="text"
                value={datosUsuario.telefono}
                onChange={manejarCambio}
                placeholder="000 0000 00"
                disabled={cargando}
              />
            </div>
          </div>

          <div className="row">
            <div className="form-group">
              <label htmlFor="numeroEmpleado">No. Empleado*</label>
              <input
                id="numeroEmpleado"
                disabled
                value={datosUsuario.numeroEmpleado}
                className="disabled-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fechaCreacion">Fecha de Creación *</label>
              <input
                id="fechaCreacion"
                name="fechaCreacion"
                type="text"
                value={datosUsuario.fechaCreacion}
                onChange={manejarCambio}
                disabled={cargando}
                placeholder="Ej. DD/MM/AAAA"
                required
              />
            </div>
          </div>

          <div className="info-box-modal">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Los campos bloqueados no pueden ser modificados</span>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={alCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalActualizarDatos;