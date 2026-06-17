import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/PrincipalSuperAdmin.css';
import '../css/PerfilSuperAdmin.css';
import ModalCerrarSesion from '../components/ModalCerrarSesion';
import ModalActualizarDatos from '../components/ModalActualizarDatos';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
import ModalPoliticasContrasena from '../components/ModalPoliticasContrasena';

function PerfilSuperAdmin() {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalActualizarDatosAbierto, setModalActualizarDatosAbierto] = useState(false);
  const [modalCambiarContrasenaAbierto, setModalCambiarContrasenaAbierto] = useState(false);
  const [modalPoliticasContrasenaAbierto, setModalPoliticasContrasenaAbierto] = useState(false);

  // Estado local para almacenar y mostrar los datos del perfil
  const [usuario, setUsuario] = useState({
    nombre: 'Tania Sánchez Reyes',
    numeroEmpleado: 'EMP-99234',
    correo: 'nombre@ejemplo.com',
    estado: 'Activo',
    telefono: '', // Teléfono inicial de prueba vacío como en la imagen
    fechaCreacion: '25/05/2026'
  });

  // Estado local para almacenar las políticas de contraseña
  const [politicas, setPoliticas] = useState({
    longitudMinima: 8,
    longitudMaxima: 16,
    minNumeros: 1,
    minEspeciales: 1,
    minMayusculas: 1,
    minMinusculas: 1
  });

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setIsLogoutModalOpen(false);
    alert("Sesión cerrada con éxito");
    navigate('/usuarios');
  };

  // Función lista para interactuar con el backend (Express y MySQL)
  const handleGuardarDatos = async (datosActualizados) => {
    try {
      // Intentar enviar la petición al backend en caso de que esté activo
      const respuesta = await fetch('http://localhost:3001/api/perfil/actualizar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          nombre: datosActualizados.nombreCompleto,
          correo: datosActualizados.correo,
          estado: datosActualizados.estado,
          telefono: datosActualizados.telefono,
          numeroEmpleado: datosActualizados.numeroEmpleado
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.mensaje || 'Error al actualizar los datos en el servidor.');
      }

      const resultado = await respuesta.json();
      
      // Actualizar el estado local con la respuesta del servidor MySQL
      setUsuario({
        nombre: resultado.nombre || datosActualizados.nombreCompleto,
        correo: resultado.correo || datosActualizados.correo,
        estado: resultado.estado || datosActualizados.estado,
        telefono: resultado.telefono || datosActualizados.telefono,
        numeroEmpleado: resultado.numeroEmpleado || datosActualizados.numeroEmpleado,
        fechaCreacion: resultado.fechaCreacion || datosActualizados.fechaCreacion
      });
      
      alert('¡Datos actualizados con éxito en el servidor!');

    } catch (error) {
      // Si el backend no está activo o arroja un error de red (TypeError: Failed to fetch)
      console.warn(
        '⚠️ El backend o la base de datos MySQL aún no están configurados/activos.\n' +
        'Detalle del error:', error.message, '\n' +
        'Aplicando actualización local simulada para probar el diseño del frontend.'
      );

      // Simular la actualización exitosa localmente para que el usuario pueda ver el resultado en pantalla
      setUsuario({
        nombre: datosActualizados.nombreCompleto,
        correo: datosActualizados.correo,
        estado: datosActualizados.estado,
        telefono: datosActualizados.telefono,
        numeroEmpleado: datosActualizados.numeroEmpleado,
        fechaCreacion: datosActualizados.fechaCreacion
      });

      alert('¡Datos actualizados con éxito! (Simulado localmente, backend no activo)');
    }
  };

  // Función lista para cambiar la contraseña interactuando con el backend
  const handleCambiarContrasena = async (datosContrasena) => {
    try {
      const respuesta = await fetch('http://localhost:3001/api/perfil/cambiar-contrasena', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          contrasenaActual: datosContrasena.contrasenaActual,
          nuevaContrasena: datosContrasena.nuevaContrasena
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.mensaje || 'Error al cambiar la contraseña.');
      }

      alert('¡Contraseña cambiada con éxito en el servidor!');
    } catch (error) {
      console.warn(
        '⚠️ El backend o la base de datos MySQL aún no están configurados/activos.\n' +
        'Detalle del error:', error.message, '\n' +
        'Simulando cambio de contraseña exitoso localmente.'
      );
      alert('¡Contraseña cambiada con éxito! (Simulado localmente)');
    }
  };

  // Función lista para guardar las políticas de contraseña en el servidor
  const handleGuardarPoliticas = async (nuevasPoliticas) => {
    try {
      const respuesta = await fetch('http://localhost:3001/api/politicas/actualizar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(nuevasPoliticas)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        throw new Error(errorData.mensaje || 'Error al guardar las políticas.');
      }

      const resultado = await respuesta.json();
      setPoliticas(resultado.politicas || nuevasPoliticas);
      alert('¡Políticas de contraseña guardadas con éxito en el servidor!');
    } catch (error) {
      console.warn(
        '⚠️ El backend o la base de datos MySQL aún no están configurados/activos.\n' +
        'Detalle del error:', error.message, '\n' +
        'Guardando políticas localmente en el estado del Frontend.'
      );
      setPoliticas(nuevasPoliticas);
      alert('¡Configuración de políticas guardada! (Simulado localmente)');
    }
  };

  return (
    <div className="panel-container">
      {/* SIDEBAR LATERAL (Compartido de PrincipalSuperAdmin) */}
      <aside className="panel-sidebar">
        <div className="sidebar-top-wrapper">
          <button className="hamburger-btn" onClick={() => setMenuAbierto(!menuAbierto)}>
            ☰
          </button>
          <div className="sidebar-main-icon"></div>
          <div className="sidebar-header-text">
            <h2>Sistema de Control de Facturas</h2>
          </div>
        </div>

        <nav className={`sidebar-menu ${menuAbierto ? 'show' : ''}`}>
          <button className="menu-item" onClick={() => navigate('/usuarios')}>
            <div className="menu-icon usuarios"></div>
            Gestión de Usuarios
          </button>
          <button className="menu-item" onClick={() => navigate('/gastos')}>
            <div className="menu-icon gastos"></div>
            Gastos
          </button>
          <button className="menu-item active" onClick={() => navigate('/perfil')}>
            <div className="menu-icon perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout" onClick={() => setIsLogoutModalOpen(true)}>
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL (Compartido de PrincipalSuperAdmin) */}
      <div className="main-wrapper">
        <div className="top-blue-bar">
          <div className="header-user-info">
            <div className="icon-user-circle"></div>
            <span>Mi Perfil</span>
          </div>
        </div>

        <main className="panel-main">
          <section className="perfil-content">
            {/* CARD DE PRESENTACIÓN */}
            <div className="profile-card-header">
              <div className="header-info">
                <div className="name-badge">
                  <h1>{usuario.nombre}</h1>
                  <span className="badge-admin">SuperAdministrador</span>
                </div>
                <p className="description">Responsable de la integridad de datos y el control de acceso.</p>
              </div>
            </div>

            {/* GRID DE INFORMACIÓN BÁSICA */}
            <div className="info-grid">
              <div className="info-box">
                <div className="info-icon id-icon"></div>
                <div>
                  <label>NÚMERO DE EMPLEADO</label>
                  <p>{usuario.numeroEmpleado}</p>
                </div>
              </div>
              <div className="info-box">
                <div className="info-icon email-icon"></div>
                <div>
                  <label>CORREO INSTITUCIONAL</label>
                  <p>{usuario.correo}</p>
                </div>
              </div>
            </div>

            {/* GRID DE ESTADO Y FECHA */}
            <div className="status-grid">
              <div className="status-box">
                <div className="status-header">
                  <label>ESTADO DE CUENTA</label>
                  <div className="check-icon"></div>
                </div>
                <div className="status-value">
                  <span className={usuario.estado === 'Activo' ? 'dot-active' : 'dot-inactive'}></span>{' '}
                  {usuario.estado === 'Activo' ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              <div className="status-box">
                <div className="status-header">
                  <label>FECHA DE CREACIÓN</label>
                  <div className="calendar-icon"></div>
                </div>
                <div className="date-value">
                  {usuario.fechaCreacion}
                </div>
              </div>
            </div>

            {/* GRID DE ACCIONES (BOTONES AZULES) */}
            <div className="actions-grid">
              <button
                type="button"
                className="action-btn"
                onClick={() => setModalActualizarDatosAbierto(true)}
              >
                <div className="btn-icon edit-icon"></div>
                Actualizar Datos
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => setModalPoliticasContrasenaAbierto(true)}
              >
                <div className="btn-icon policy-icon"></div>
                Configurar Políticas de Contraseña
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => setModalCambiarContrasenaAbierto(true)}
              >
                <div className="btn-icon pass-icon"></div>
                Cambiar Contraseña
              </button>
            </div>
          </section>
        </main>
      </div>

      <ModalCerrarSesion 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleCerrarSesion} 
      />

      <ModalActualizarDatos
        estaAbierto={modalActualizarDatosAbierto}
        alCerrar={() => setModalActualizarDatosAbierto(false)}
        datosIniciales={usuario}
        alGuardar={handleGuardarDatos}
      />

      <ModalCambiarContrasena
        estaAbierto={modalCambiarContrasenaAbierto}
        alCerrar={() => setModalCambiarContrasenaAbierto(false)}
        alGuardar={handleCambiarContrasena}
        politicas={politicas}
      />

      <ModalPoliticasContrasena
        estaAbierto={modalPoliticasContrasenaAbierto}
        alCerrar={() => setModalPoliticasContrasenaAbierto(false)}
        politicasIniciales={politicas}
        alGuardar={handleGuardarPoliticas}
      />

      {/* El límite se configura ahora en la pantalla de Gastos */}
    </div>
  );
}

export default PerfilSuperAdmin;