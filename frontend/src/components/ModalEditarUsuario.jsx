import React, { useState, useEffect } from 'react';
import '../css/ModalEditarUsuario.css';

function ModalEditarUsuario({ isOpen, onClose, usuario, onSave }) {
  // Estados para los campos editables
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('');
  const [telefono, setTelefono] = useState('');

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
      setTelefono(usuario.telefono || '');
      setErrors({});
    }
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const handleSave = async () => {
    const tempErrors = {};

    // Validaciones
    if (!nombre.trim()) {
      tempErrors.nombre = 'El nombre completo es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      tempErrors.nombre = 'El nombre solo debe contener letras y espacios';
    }

    if (!rfc.trim()) {
      tempErrors.rfc = 'El RFC es obligatorio';
    } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc)) {
      tempErrors.rfc = 'Formato de RFC inválido (debe tener 12 o 13 caracteres válidos)';
    }

    if (!correo.trim()) {
      tempErrors.correo = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      tempErrors.correo = 'Formato de correo electrónico inválido';
    }

    if (!rol) {
      tempErrors.rol = 'Debe seleccionar un rol';
    }

    if (!telefono.trim()) {
      tempErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{7,10}$/.test(telefono)) {
      tempErrors.telefono = 'El teléfono debe tener entre 7 y 10 dígitos';
    }

    setErrors(tempErrors);

    // Si no hay errores, procedemos a guardar
    if (Object.keys(tempErrors).length === 0) {
      setCargando(true);
      try {
        const partesNombre = nombre.trim().split(/\s+/);
        const primerNombre = partesNombre[0] || nombre.trim();
        const apPaterno = partesNombre[1] || 'NA';
        const apMaterno = partesNombre.slice(2).join(' ') || 'NA';

        await onSave({
          ...usuario,
          numeroEmpleado: usuario.numeroEmpleado,   // 👈 obligatorio
          nombre: primerNombre,
          apellidoPaterno: apPaterno,
          apellidoMaterno: apMaterno,
          rfc: rfc.toUpperCase().trim(),
          correo: correo.trim(),
          rol: rol.toUpperCase(),
          telefono: telefono.trim() || "0000000000",
          estado: usuario.estado || 'ACTIVO'
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
              value={usuario.numeroEmpleado || ''}
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
            <label>Teléfono*</label>
            <input
              type="text"
              placeholder="Ej. 7771234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={errors.telefono ? 'input-error' : ''}
              disabled={cargando}
            />
            {errors.telefono && <span className="error-text-span">{errors.telefono}</span>}
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
