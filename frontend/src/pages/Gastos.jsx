import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/PrincipalSuperAdmin.css';
import '../css/Gastos.css';
import ModalCerrarSesion from '../components/ModalCerrarSesion';

function Gastos() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  // 1. Estado para el Límite de Facturación Empresarial (Global)
  const [limiteEmpresarial, setLimiteEmpresarial] = useState(() => {
    const guardado = localStorage.getItem('limiteFacturacionEmpresarial');
    return guardado ? Number(guardado) : 100000; // Valor por defecto de $100,000
  });

  // 2. Estado para los Empleados (se comparte con Gestión de Usuarios usando localStorage)
  const [empleados, setEmpleados] = useState(() => {
    const guardados = localStorage.getItem('empleados');
    if (guardados) {
      try {
        return JSON.parse(guardados);
      } catch (e) {
        console.error("Error al cargar empleados en Gastos:", e);
      }
    }
    // Fallback si no existen empleados guardados
    return [
      { id: 1, num: '#2026-04', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true, limiteGasto: 15000 },
      { id: 2, num: '#2026-58', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true, limiteGasto: 12000 },
      { id: 3, num: '#2026-59', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true, limiteGasto: 10000 },
      { id: 4, num: '#2026-60', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true, limiteGasto: 20000 },
      { id: 5, num: '#2026-61', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true, limiteGasto: 8000 },
      { id: 6, num: '#2026-62', nombre: 'Ana Flores García', rfc: 'GFRL8848HJK4', correo: 'nombre@ejemplo.com', rol: 'USUARIO', activo: true, limiteGasto: 5000 },
      { id: 7, num: '#2026-63', nombre: 'José Valdez García', rfc: 'MERL80412H34', correo: 'nombre@ejemplo.com', rol: 'ADMINISTRADOR', activo: true, limiteGasto: 18000 }
    ];
  });

  // 3. Cargar datos del Servidor Backend si está disponible (MySQL)
  useEffect(() => {
    const cargarDatosDesdeBackend = async () => {
      try {
        const respuesta = await fetch('http://localhost:3001/api/gastos/obtener');
        if (respuesta.ok) {
          const resultado = await respuesta.json();
          // Si el backend tuviera ya la conexión lista y retornara los datos, actualizaríamos:
          if (resultado.limiteEmpresarial) {
            setLimiteEmpresarial(Number(resultado.limiteEmpresarial));
          }
          if (resultado.empleados) {
            setEmpleados(resultado.empleados);
          }
        }
      } catch (error) {
        console.log("Servidor backend no disponible para obtener gastos. Usando persistencia local (localStorage).");
      }
    };
    cargarDatosDesdeBackend();
  }, []);

  // 4. Filtrar únicamente los usuarios activos para mostrarlos en la tabla
  const usuariosActivos = empleados.filter(emp => emp.activo);

  // 5. Filtrar por búsqueda (nombre, correo o rfc)
  const usuariosFiltrados = usuariosActivos.filter(emp =>
    emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.rfc.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginación
  const registrosPorPagina = 5;
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosPaginaActual = usuariosFiltrados.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);

  // 6. Cambiar el límite de gasto de un usuario en el estado local
  const handleCambioLimiteUsuario = (id, nuevoValor) => {
    const valorNumerico = nuevoValor === '' ? 0 : Number(nuevoValor);
    setEmpleados(prev => prev.map(emp => 
      emp.id === id ? { ...emp, limiteGasto: valorNumerico } : emp
    ));
  };

  // 7. Calcular la suma total de los límites individuales asignados
  const sumaTotalAsignada = usuariosActivos.reduce((sum, emp) => sum + (emp.limiteGasto || 0), 0);

  // 8. Validar si excede el límite empresarial global
  const esExcedido = sumaTotalAsignada > limiteEmpresarial;
  const montoDiferencia = sumaTotalAsignada - limiteEmpresarial;

  // 9. Guardar los límites en la base de datos (Backend) y localmente (LocalStorage)
  const handleGuardarCambios = async () => {
    if (esExcedido) {
      alert("Error: No se pueden guardar los cambios porque el total asignado excede el límite empresarial.");
      return;
    }

    try {
      // Guardar localmente
      localStorage.setItem('empleados', JSON.stringify(empleados));
      localStorage.setItem('limiteFacturacionEmpresarial', String(limiteEmpresarial));

      // Enviar cambios al backend Express y MySQL
      const respuesta = await fetch('http://localhost:3001/api/gastos/actualizar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limiteEmpresarial: Number(limiteEmpresarial),
          empleados: empleados
        })
      });

      if (!respuesta.ok) {
        throw new Error("Respuesta de servidor no exitosa.");
      }

      const data = await respuesta.json();
      if (data.simulado) {
        alert("¡Configuración guardada con éxito! (Simulado en Local Storage)");
      } else {
        alert("¡Límites actualizados con éxito en la Base de Datos MySQL!");
      }

    } catch (error) {
      console.warn("⚠️ Falló la conexión con el Backend MySQL. Los cambios se guardaron localmente en el navegador.", error);
      alert("¡Cambios guardados con éxito localmente! (Backend no activo)");
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setModalCerrarSesionAbierto(false);
    alert("Sesión cerrada con éxito");
    window.location.reload();
  };

  return (
    <div className="panel-container">
      {/* MENÚ LATERAL */}
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
          <button className="menu-item active" onClick={() => navigate('/gastos')}>
            <div className="menu-icon gastos"></div>
            Gastos
          </button>
          <button className="menu-item" onClick={() => navigate('/perfil')}>
            <div className="menu-icon perfil"></div>
            Mi Perfil
          </button>
          <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
            <div className="logout-icon"></div>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <div className="main-wrapper">
        <div className="top-blue-bar">
          <div className="header-user-info">
            <div className="icon-user-circle"></div>
            <span>Configuración de Gastos</span>
          </div>
        </div>

        <main className="panel-main">
          {/* SECCIÓN 1: CONFIGURACIÓN LÍMITE EMPRESARIAL */}
          <section className="gastos-config-section">
            <div className="config-card global-limit-card">
              <div className="config-card-header">
                <h3>Límite de Facturación Empresarial</h3>
                <p className="subtitle">Configura el presupuesto máximo mensual global para toda la empresa.</p>
              </div>
              <div className="config-card-body">
                <div className="input-group-limit">
                  <label htmlFor="input-global-limit">MONTO GLOBAL MÁXIMO</label>
                  <div className="currency-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input 
                      id="input-global-limit"
                      type="number" 
                      placeholder="100000"
                      value={limiteEmpresarial}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setLimiteEmpresarial(val);
                      }}
                    />
                  </div>
                </div>

                {/* Dashboard del Estado del Presupuesto */}
                <div className="presupuesto-dashboard">
                  <div className="dash-item">
                    <span className="dash-label">Límite Global</span>
                    <span className="dash-value">${Number(limiteEmpresarial).toLocaleString()}</span>
                  </div>
                  <div className="dash-item">
                    <span className="dash-label">Total Asignado</span>
                    <span className={`dash-value ${esExcedido ? 'text-danger' : 'text-success'}`}>
                      ${sumaTotalAsignada.toLocaleString()}
                    </span>
                  </div>
                  <div className="dash-item">
                    <span className="dash-label">{esExcedido ? 'Excedido' : 'Disponible'}</span>
                    <span className={`dash-value ${esExcedido ? 'text-danger' : 'text-primary'}`}>
                      ${Math.abs(limiteEmpresarial - sumaTotalAsignada).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar-fill ${esExcedido ? 'exceeded' : ''}`}
                    style={{ width: `${Math.min((sumaTotalAsignada / (limiteEmpresarial || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* BANNER DE ERROR SI SE SUPERA EL LÍMITE */}
          {esExcedido && (
            <div className="error-banner">
              <div className="error-icon">⚠</div>
              <div className="error-message">
                <strong>Presupuesto excedido:</strong> La suma de los montos individuales (${sumaTotalAsignada.toLocaleString()}) supera el límite de facturación empresarial asignado (${Number(limiteEmpresarial).toLocaleString()}) por <strong>${montoDiferencia.toLocaleString()}</strong>. Ajuste los valores para habilitar el guardado.
              </div>
            </div>
          )}

          {/* SECCIÓN 2: TABLA DE USUARIOS ACTIVOS */}
          <header className="main-header select-users-header">
            <div className="table-title-container">
              <h3>Distribución de Presupuestos</h3>
              <p className="table-subtitle">Asigna el monto permitido de facturación a cada usuario activo.</p>
            </div>
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
          </header>

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
                    <th className="col-monto">MONTO PERMITIDO ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPaginaActual.length > 0 ? (
                    registrosPaginaActual.map((emp, index) => (
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
                          <span className="badge-estado activo">ACTIVO</span>
                        </td>
                        <td className="col-monto">
                          <div className="cell-input-wrapper">
                            <span className="cell-currency">$</span>
                            <input 
                              type="number" 
                              className="user-limit-input"
                              value={emp.limiteGasto === undefined ? '' : emp.limiteGasto} 
                              onChange={(e) => handleCambioLimiteUsuario(emp.id, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="empty-table-row">
                        No se encontraron usuarios activos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginador */}
            <div className="table-footer-actions">
              {totalPaginas > 1 ? (
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
              ) : <div className="spacer-footer"></div>}

              {/* Botón Guardar Cambios */}
              <button 
                className={`btn-guardar-gastos ${esExcedido ? 'disabled' : ''}`}
                onClick={handleGuardarCambios}
                disabled={esExcedido}
              >
                Guardar Configuración
              </button>
            </div>
          </section>
        </main>
      </div>

      <ModalCerrarSesion 
        isOpen={modalCerrarSesionAbierto} 
        onClose={() => setModalCerrarSesionAbierto(false)} 
        onConfirm={handleCerrarSesion}
      />
    </div>
  );
}

export default Gastos;
