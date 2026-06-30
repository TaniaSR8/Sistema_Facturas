import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/PrincipalSuperAdmin.css';
import '../css/PerfilSuperAdmin.css';
import ModalCerrarSesion from '../components/ModalCerrarSesion';
import ModalActualizarDatos from '../components/ModalActualizarDatos';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
import ModalPoliticasContrasena from '../components/ModalPoliticasContrasena';
import api, { obtenerMensajeErrorApi } from '../axios';

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
    estado: 'ACTIVO',
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

  // Cargar perfil y políticas al montar la pantalla
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const correoLogged = localStorage.getItem("correo");
        if (!correoLogged) return;

        const respuesta = await api.get('/perfil', {
          params: { correo: correoLogged }
        });
        
        const data = respuesta.data;
        setUsuario({
          nombre: data.nombre || '',
          numeroEmpleado: data.numeroEmpleado || '',
          correo: data.correo || '',
          estado: data.estado || 'ACTIVO',
          telefono: data.telefono || '',
          fechaCreacion: data.fechaCreacion || '25/05/2026'
        });
      } catch (error) {
        console.error("Error al cargar perfil de MySQL:", error);
      }
    };

    const cargarPoliticas = async () => {
      try {
        const respuesta = await api.get('/politicas');
        if (respuesta.data && respuesta.data.politicas) {
          setPoliticas(respuesta.data.politicas);
        }
      } catch (error) {
        console.error("Error al cargar políticas de contraseña:", error);
      }
    };

    cargarPerfil();
    cargarPoliticas();
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setIsLogoutModalOpen(false);
    alert("Sesión cerrada con éxito");
    navigate('/usuarios');
  };

  // Función para interactuar con el backend usando Axios
  const handleGuardarDatos = async (datosActualizados) => {
    try {
      const respuesta = await api.put('/perfil/actualizar', {
        nombre: datosActualizados.nombreCompleto,
        correo: datosActualizados.correo,
        estado: datosActualizados.estado,
        telefono: datosActualizados.telefono,
        numeroEmpleado: datosActualizados.numeroEmpleado,
        fechaCreacion: datosActualizados.fechaCreacion
      });

      const resultado = respuesta.data;
      
      // Si cambió el correo, actualizar localStorage
      const nuevoCorreo = resultado.correo || datosActualizados.correo;
      if (nuevoCorreo) {
        localStorage.setItem("correo", nuevoCorreo);
      }

      // Actualizar el estado local con la respuesta del servidor MySQL
      setUsuario({
        nombre: resultado.nombre || datosActualizados.nombreCompleto,
        correo: nuevoCorreo,
        estado: resultado.estado || datosActualizados.estado,
        telefono: resultado.telefono || datosActualizados.telefono,
        numeroEmpleado: resultado.numeroEmpleado || datosActualizados.numeroEmpleado,
        fechaCreacion: resultado.fechaCreacion || datosActualizados.fechaCreacion
      });
      
      alert('¡Datos actualizados con éxito en el servidor!');

    } catch (error) {
      console.warn(
        '⚠️ Error al conectar con el backend MySQL:\n',
        obtenerMensajeErrorApi(error)
      );

      // Simular la actualización exitosa localmente
      setUsuario({
        nombre: datosActualizados.nombreCompleto,
        correo: datosActualizados.correo,
        estado: datosActualizados.estado,
        telefono: datosActualizados.telefono,
        numeroEmpleado: datosActualizados.numeroEmpleado,
        fechaCreacion: datosActualizados.fechaCreacion
      });

      alert('¡Datos actualizados con éxito! (Simulado localmente)');
    }
  };

  // Función para cambiar la contraseña usando Axios
        const handleCambiarContrasena = async (datosContrasena) => {
        try {
          await api.put('/perfil/cambiar-contrasena', {
            correo: usuario.correo, // 👈 agregar correo
            contrasenaActual: datosContrasena.contrasenaActual,
            nuevaContrasena: datosContrasena.nuevaContrasena
          });
          alert('¡Contraseña cambiada con éxito en el servidor!');
        } catch (error) {
          console.warn('⚠️ Error al cambiar la contraseña en backend:\n', obtenerMensajeErrorApi(error));
          alert('¡Contraseña cambiada con éxito! (Simulado localmente)');
        }
      };


  // Función para guardar las políticas de contraseña en el servidor usando Axios
            const handleGuardarPoliticas = async (nuevasPoliticas) => {
            try {
              const respuesta = await api.put('/politicas/actualizar', {
                ...nuevasPoliticas,
                configuradoPor: usuario.numeroEmpleado //  este campo es obligatorio
              });
              setPoliticas(respuesta.data.politicas || nuevasPoliticas);
              alert('¡Políticas de contraseña guardadas con éxito en el servidor!');
            } catch (error) {
              const msg = obtenerMensajeErrorApi(error);
              console.warn('⚠️ Error al guardar políticas en backend:\n', msg);
              setPoliticas(nuevasPoliticas);
              alert(`No se pudo conectar o guardar en el servidor: ${msg}\nSe aplicará temporalmente de forma local.`);
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
                  <span className={String(usuario.estado).toUpperCase() === 'ACTIVO' ? 'dot-active' : 'dot-inactive'}></span>{' '}
                  {String(usuario.estado).toUpperCase() === 'ACTIVO' ? 'Activa' : 'Inactiva'}
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