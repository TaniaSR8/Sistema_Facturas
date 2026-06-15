import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/PrincipalSuperAdmin.css';
import '../css/PerfilSuperAdmin.css';
import ModalCerrarSesion from '../components/ModalCerrarSesion';

function PerfilSuperAdmin() {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setIsLogoutModalOpen(false);
    alert("Sesión cerrada con éxito");
    navigate('/usuarios');
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
                  <h1>Tania Sánchez Reyes</h1>
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
                  <p>EMP-99234</p>
                </div>
              </div>
              <div className="info-box">
                <div className="info-icon email-icon"></div>
                <div>
                  <label>CORREO INSTITUCIONAL</label>
                  <p>nombre@ejemplo.com</p>
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
                  <span className="dot-active"></span> Activa
                </div>
              </div>
              <div className="status-box">
                <div className="status-header">
                  <label>FECHA DE CREACIÓN</label>
                  <div className="calendar-icon"></div>
                </div>
                <div className="date-value">
                  25/05/2026
                </div>
              </div>
            </div>

            {/* GRID DE ACCIONES (BOTONES AZULES) */}
            <div className="actions-grid">
              <button className="action-btn">
                <div className="btn-icon edit-icon"></div>
                Actualizar Datos
              </button>
              <button className="action-btn">
                <div className="btn-icon pass-icon"></div>
                Cambiar Contraseña
              </button>
              <button className="action-btn">
                <div className="btn-icon policy-icon"></div>
                Configurar Políticas de Contraseña
              </button>
              <button className="action-btn">
                <div className="btn-icon limit-icon"></div>
                Configurar límite de facturación empresarial
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
    </div>
  );
}

export default PerfilSuperAdmin;