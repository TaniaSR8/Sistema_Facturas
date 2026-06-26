import React, { useState, useEffect } from 'react';
import '../css/ModalAgregarUsuario.css';

function ModalAgregarUsuario({ isOpen, onClose, onRegister }) {
  // Estados para los campos del formulario
  const [noEmpleado, setNoEmpleado] = useState('');
  const [rfc, setRfc] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState('');
  const [rol, setRol] = useState('');

  // Estado para la contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para almacenar los mensajes de error
  const [errors, setErrors] = useState({});

  // Limpiar el formulario y errores cuando el modal se abre o cierra
  useEffect(() => {
    if (isOpen) {
      setNoEmpleado('');
      setRfc('');
      setNombre('');
      setCorreo('');
      setPassword('');
      setTelefono('');
      setEstado('');
      setRol('');
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegister = async () => {
    const tempErrors = {};

    // 1. Validación de No. Empleado
    if (!noEmpleado.trim()) {
      tempErrors.noEmpleado = 'El número de empleado es obligatorio';
    } else if (!/^\d+$/.test(noEmpleado)) {
      tempErrors.noEmpleado = 'El número de empleado debe ser numérico';
    }

    // 2. Validación de RFC Empleado
    if (!rfc.trim()) {
      tempErrors.rfc = 'El RFC es obligatorio';
    } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc)) {
      tempErrors.rfc = 'Formato de RFC inválido (debe tener 12 o 13 caracteres válidos)';
    }

    // 3. Validación de Nombre Completo
    if (!nombre.trim()) {
      tempErrors.nombre = 'El nombre completo es obligatorio';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      tempErrors.nombre = 'El nombre solo debe contener letras y espacios';
    }

    // 4. Validación de Correo
    if (!correo.trim()) {
      tempErrors.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      tempErrors.correo = 'Formato de correo electrónico inválido';
    }

    // 5. Validación de Contraseña Temporal
    if (!password) {
      tempErrors.password = 'La contraseña temporal es obligatoria';
    } else if (password.length < 8) {
      tempErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    // 6. Validación de Teléfono
    const cleanTelefono = telefono.replace(/\s/g, '');
    if (!telefono.trim()) {
      tempErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(cleanTelefono)) {
      tempErrors.telefono = 'El teléfono debe tener exactamente 10 dígitos';
    }

    // 7. Validación de Estado
    if (!estado) {
      tempErrors.estado = 'Debe seleccionar un estado';
    }

    // 8. Validación de Rol de Usuario
    if (!rol) {
      tempErrors.rol = 'Debe seleccionar un rol';
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0) {
      if (onRegister) {
        const exito = await onRegister({
          noEmpleado,
          rfc,
          nombre,
          correo,
          password,
          telefono: cleanTelefono,
          estado,
          rol,
        });
        if (exito) onClose();
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Usuario</h2>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>No. Empleado*</label>
              <input 
                type="text" 
                placeholder="Ej. 0101" 
                value={noEmpleado}
                onChange={(e) => setNoEmpleado(e.target.value)}
                className={errors.noEmpleado ? 'input-error' : ''}
              />
              {errors.noEmpleado && <span className="error-text">{errors.noEmpleado}</span>}
            </div>
            <div className="form-group">
              <label>RFC Empleado*</label>
              <input 
                type="text" 
                placeholder="Ej. X000XX0X0X" 
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className={errors.rfc ? 'input-error' : ''}
              />
              {errors.rfc && <span className="error-text">{errors.rfc}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label>Nombre Completo*</label>
            <input 
              type="text" 
              placeholder="Ej. nombre apellidos ...." 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={errors.nombre ? 'input-error' : ''}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          <div className="form-group">
            <label>Correo*</label>
            <input 
              type="email" 
              placeholder="Ej. nombre@ejemplo.com" 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={errors.correo ? 'input-error' : ''}
            />
            {errors.correo && <span className="error-text">{errors.correo}</span>}
          </div>
          
          <div className="form-group">
            <label>Contraseña Temporal*</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'input-error' : ''}
              />
              <div 
                className="eye-icon" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar" : "Ver"}
              ></div>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
              *El usuario cambiará esta contraseña al iniciar sesión por primera vez.
            </small>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>TELEFONO *</label>
              <input 
                type="tel" 
                placeholder="000 000 00 00" 
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={errors.telefono ? 'input-error' : ''}
              />
              {errors.telefono && <span className="error-text">{errors.telefono}</span>}
            </div>
            <div className="form-group">
              <label>ESTADO *</label>
              <select 
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={errors.estado ? 'input-error' : ''}
              >
                <option value="">Seleccione...</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
              {errors.estado && <span className="error-text">{errors.estado}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>ROL DE USUARIO *</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="rol" 
                  value="usuario" 
                  checked={rol === 'usuario'} 
                  onChange={(e) => setRol(e.target.value)} 
                /> Usuario
              </label>
              <label>
                <input 
                  type="radio" 
                  name="rol" 
                  value="administrador" 
                  checked={rol === 'administrador'} 
                  onChange={(e) => setRol(e.target.value)} 
                /> Administrador
              </label>
            </div>
            {errors.rol && <span className="error-text">{errors.rol}</span>}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-registrar" onClick={handleRegister}>Registrar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalAgregarUsuario;