import React, { useState, useEffect } from 'react';
import '../css/ModalEditarUsuario.css';

function ModalEditarUsuario({ isOpen, onClose, usuario, onSave }) {
  // Estados para los campos editables
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('');

  // Estado de carga y errores
  const [errors, setErrors] = useState({});
  const [cargando, setCargando] = useState(false);

  // Inicializar o limpiar campos cuando cambie el usuario o la apertura
  useEffect(() => {
    if (isOpen && usuario) {
      setNombre(usuario.nombre || '');
      setRfc(usuario.rfc || '');
      setCorreo(usuario.correo || '');
      setRol(usuario.rol ? usuario.rol.toUpperCase() : 'USUARIO');
      setErrors({});
    }
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const handleSave = async () => {
    const tempErrors = {};

    // 1. Validación de Nombre Completo
    if (!nombre.trim()) {
      tempErrors.nombre = 'El nombre completo es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      tempErrors.nombre = 'El nombre solo debe contener letras y espacios';
    }

    // 2. Validación de RFC Empleado
    if (!rfc.trim()) {
      tempErrors.rfc = 'El RFC es obligatorio';
    } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc)) {
      tempErrors.rfc = 'Formato de RFC inválido (debe tener 12 o 13 caracteres válidos)';
    }

    // 3. Validación de Correo
    if (!correo.trim()) {
      tempErrors.correo = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      tempErrors.correo = 'Formato de correo electrónico inválido';
    }

    // 4. Validación de Rol
    if (!rol) {
      tempErrors.rol = 'Debe seleccionar un rol';
    }

    setErrors(tempErrors);

    // Si no hay errores, procedemos a guardar
    if (Object.keys(tempErrors).length === 0) {
      setCargando(true);
      try {
        await onSave({
          ...usuario,
          nombre: nombre.trim(),
          rfc: rfc.toUpperCase().trim(),
          correo: correo.trim(),
          rol: rol.toUpperCase()
        });
        onClose();
      } catch (err) {
        console.error('Error al guardar cambios de usuario:', err);
      } finally {
        setCargando(false);
      }
    }
  };

  return (
    <div className="modal-editar-overlay">
      <div className="modal-editar-content">
        <div className="modal-editar-header">
          <h2>Editar Usuario</h2>
        </div>

        <div className="modal-editar-body">
          <div className="form-group-vertical">
            <label>Número de empleado</label>
            <input
              type="text"
              value={usuario.num || ''}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group-vertical">
            <label>Nombre completo*</label>
            <input
              type="text"
              placeholder="Ej. Juan Pérez López"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={errors.nombre ? 'input-error' : ''}
              disabled={cargando}
            />
            {errors.nombre && <span className="error-text-span">{errors.nombre}</span>}
          </div>

          <div className="form-group-vertical">
            <label>RFC del empleado*</label>
            <input
              type="text"
              placeholder="Ej. PELA940523ABC"
              value={rfc}
              onChange={(e) => setRfc(e.target.value.toUpperCase())}
              className={errors.rfc ? 'input-error' : ''}
              disabled={cargando}
            />
            {errors.rfc && <span className="error-text-span">{errors.rfc}</span>}
          </div>

          <div className="form-group-vertical">
            <label>Correo electrónico*</label>
            <input
              type="email"
              placeholder="Ej. correo@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={errors.correo ? 'input-error' : ''}
              disabled={cargando}
            />
            {errors.correo && <span className="error-text-span">{errors.correo}</span>}
          </div>

          <div className="form-group-vertical">
            <label>Rol*</label>
            <div className="select-container-vertical">
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className={errors.rol ? 'input-error' : ''}
                disabled={cargando}
              >
                <option value="USUARIO">USUARIO</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              </select>
            </div>
            {errors.rol && <span className="error-text-span">{errors.rol}</span>}
          </div>
        </div>

        <div className="modal-editar-actions">
          <button 
            className="btn-cancelar-edit" 
            onClick={onClose} 
            disabled={cargando}
          >
            Cancelar
          </button>
          <button 
            className="btn-guardar-edit" 
            onClick={handleSave} 
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalEditarUsuario;
