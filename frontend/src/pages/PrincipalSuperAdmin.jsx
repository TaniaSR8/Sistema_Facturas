import React, { useState } from "react";
import '../css/PrincipalSuperAdmin.css';
import ModalAgregarUsuario from '../components/ModalAgregarUsuario';



function PrincipalSuperAdmin() {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState(false); // Estado para el menú hamburguesa
  const [isModalOpen, setIsModalOpen] = useState(false);

  const registrosPorPagina = 7;

  const [empleados, setEmpleados] = useState([
    { id: 1, num: '#2026-04', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true },
    { id: 2, num: '#2026-58', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true },
    { id: 3, num: '#2026-59', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true },
    { id: 4, num: '#2026-60', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true },
    { id: 5, num: '#2026-61', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true },
    { id: 6, num: '#2026-62', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true },
    { id: 7, num: '#2026-63', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true }
  ]);

  const controlarToggle = (id) => {
    setEmpleados(empleados.map(emp => 
      emp.id === id ? { ...emp, activo: !emp.activo } : emp
    ));
  };

  const handleAgregarUsuario = (nuevoUsuario) => {
    setEmpleados(prev => [
      ...prev,
      {
        id: prev.length > 0 ? Math.max(...prev.map(e => e.id)) + 1 : 1,
        num: nuevoUsuario.noEmpleado ? `#${nuevoUsuario.noEmpleado}` : `#2026-${Math.floor(Math.random() * 90) + 10}`,
        nombre: nuevoUsuario.nombre,
        rfc: nuevoUsuario.rfc,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol.toUpperCase(),
        activo: nuevoUsuario.estado === 'activo'
      }
    ]);
  };

  const empleadosFiltrados = empleados.filter(emp =>
    emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.rfc.toLowerCase().includes(busqueda.toLowerCase())
  );

  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosPaginaActual = empleadosFiltrados.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(empleadosFiltrados.length / registrosPorPagina);

  return (
    <div className="panel-container">
      <aside className="panel-sidebar">
        <div className="sidebar-top-wrapper">
          {/* Botón de hamburguesa integrado */}
          <button className="hamburger-btn" onClick={() => setMenuAbierto(!menuAbierto)}>
            ☰
          </button>
          <div className="sidebar-main-icon"></div>
          <div className="sidebar-header-text">
            <h2>Sistema de Control de Facturas</h2>
          </div>
        </div>

        {/* El menú recibe la clase 'show' cuando menuAbierto es true */}
        <nav className={`sidebar-menu ${menuAbierto ? 'show' : ''}`}>
          <button className="menu-item active">
            <div className="menu-icon usuarios"></div>
            Gestión de Usuarios
          </button>
          <button className="menu-item">
            <div className="menu-icon perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout">
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <div className="main-wrapper">
        <div className="top-blue-bar"></div>

        <main className="panel-main">
          <header className="main-header">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Buscar" 
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
            <button className="btn-agregar" onClick={() => setIsModalOpen(true)}>
                + Agregar
              </button>
          </header>

          {/* TABLA CON ENFOQUE PROPORCIONAL EXACTO */}
          <section className="table-section">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-no">NO.</th>
                    <th className="col-num">NO. EMPLEADO</th>
                    <th className="col-nombre">NOMBRE COMPLETO</th>
                    <th className="col-rfc">RFC EMPLEADO</th>
                    <th className="col-correo">CORREO</th>
                    <th className="col-rol">ROL</th>
                    <th className="col-estado">ESTADO</th>
                    <th className="col-acciones">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPaginaActual.map((emp, index) => (
                    <tr key={emp.id}>
                      <td className="col-no text-gray">
                        {String(indicePrimerRegistro + index + 1).padStart(2, '0')}
                      </td>
                      <td className="col-num text-blue-bold">{emp.num}</td>
                      <td className="col-nombre" title={emp.nombre}>{emp.nombre}</td>
                      <td className="col-rfc font-medium">{emp.rfc}</td>
                      <td className="col-correo text-gray" title={emp.correo}>{emp.correo}</td>
                      <td className="col-rol">
                        <span className={`badge-rol ${emp.rol.toLowerCase()}`}>{emp.rol}</span>
                      </td>
                      <td className="col-estado">
                        <span className={`badge-estado ${emp.activo ? 'activo' : 'inactivo'}`}>
                          {emp.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="col-acciones">
                        <div className="action-buttons">
                          <button className="btn-action edit" title="Editar usuario"></button>
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={emp.activo} 
                              onChange={() => controlarToggle(emp.id)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="pagination-container">
                <button 
                  className="pagination-arrow"
                  onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                >
                  &larr; Previous
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`pagination-number ${paginaActual === i + 1 ? 'active' : ''}`}
                    onClick={() => setPaginaActual(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="pagination-arrow"
                  onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </section>

          {/* CUADROS DE RESUMEN AUTOMÁTICO */}
          <footer className="panel-cards-footer">
            <div className="summary-card">
              <div className="card-info">
                <h3>ADMINISTRADORES ACTIVOS</h3><p>30</p>
              </div>
              <div className="card-icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0059B3" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-info">
                <h3>USUARIOS ACTIVOS</h3><p>50</p>
              </div>
              <div className="card-icon-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0059B3" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
              </div>
            </div>
          </footer>
        </main>
      </div>
     {/* AQUÍ se renderiza el modal cuando isModalOpen sea true */}
      <ModalAgregarUsuario 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRegister={handleAgregarUsuario}
      />
    </div>
  );
}

export default PrincipalSuperAdmin;