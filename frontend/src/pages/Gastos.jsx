import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/PrincipalSuperAdmin.css';
import '../css/Gastos.css';
import ModalCerrarSesion from '../components/ModalCerrarSesion';
import ModalConfirmacion from '../components/ModalConfirmacion';
import { useToast } from '../components/Toast';

import axios from 'axios';

function Gastos() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
// Estado para el límite empresarial
  const [limiteEmpresarial, setLimiteEmpresarial] = useState(0);

  // Estado para empleados
  const [empleados, setEmpleados] = useState([]);

      // 🔹 Cargar datos desde el backend
      useEffect(() => {
        const cargarDatos = async () => {
          try {
            const respuesta = await axios.get('http://localhost:3001/api/gastos/obtener');

            // 🔹 Normalizar datos al cargar
            setLimiteEmpresarial(Number(respuesta.data.limiteEmpresarial));
            setEmpleados(respuesta.data.empleados.map(emp => ({
              ...emp,
              num: emp.numeroEmpleado,
              limiteGasto: emp.limiteGasto ? Number(emp.limiteGasto) : 0
            })));

          } catch (error) {
            console.error("Error al cargar presupuesto", error);
          }
        };
        cargarDatos();
      }, []);


  // 3. Filtrado y paginación (aquí va tu bloque)
  const usuariosActivos = empleados.filter(emp => emp.rol === 'USUARIO' && emp.estado === 'ACTIVO');
  const usuariosFiltrados = usuariosActivos.filter(emp =>
    (emp.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (emp.correo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (emp.rfc || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  const registrosPorPagina = 5;
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosPaginaActual = usuariosFiltrados.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);

  // 🔹 Cambiar límite de gasto
  const handleCambioLimiteUsuario = (id, nuevoValor) => {
    const valorNumerico = nuevoValor === '' ? 0 : Number(nuevoValor);
    setEmpleados(prev => prev.map(emp =>
      emp.id === id ? { ...emp, limiteGasto: valorNumerico } : emp
    ));
  };

  // 🔹 Calcular suma total
 const sumaTotalAsignada = usuariosActivos.reduce(
  (sum, emp) => sum + (Number(emp.limiteGasto) || 0),
  0
);

  const esExcedido = sumaTotalAsignada > limiteEmpresarial;

      // 🔹 Diferencia entre lo asignado y el límite
    const montoDiferencia = sumaTotalAsignada - limiteEmpresarial;


  // 🔹 Guardar cambios en backend
  const handleGuardarCambios = () => {
    if (esExcedido) {
      addToast("Error: El total asignado excede el límite empresarial.", "error");
      return;
    }
    setModalConfirmOpen(true);
  };

  const ejecutarGuardarCambios = async () => {
    setModalConfirmOpen(false);
    try {
      // 1. Guardar cambios en el backend
      await axios.put('http://localhost:3001/api/gastos/actualizar', {
        limiteEmpresarial: Number(limiteEmpresarial),
        empleados: empleados
      });

      // 2. Volver a pedir los datos actualizados
      const respuesta = await axios.get('http://localhost:3001/api/gastos/obtener');
      setLimiteEmpresarial(Number(respuesta.data.limiteEmpresarial));
      setEmpleados(respuesta.data.empleados.map(emp => ({
          ...emp,
          num: emp.numeroEmpleado,   // 👈 aquí se conserva el No. Empleado
          limiteGasto: emp.limiteGasto ? Number(emp.limiteGasto) : 0
        })));

      // 3. Confirmar al usuario
      addToast("¡Límites actualizados con éxito en la Base de Datos MySQL!", "success");
    } catch (error) {
      if (error.response) {
        addToast(`Error: ${error.response.data.message}`, "error");
      } else {
        addToast("⚠️ Falló la conexión con el Backend MySQL.", "error");
      }
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate('/login');
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
        </nav>
        <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
          <div className="logout-icon"></div>
          Cerrar Sesión
        </button>
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
                      min="0"
                      placeholder="Ingrese monto"
                      value={limiteEmpresarial === 0 ? '' : limiteEmpresarial}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setLimiteEmpresarial(val);
                      }}
                    />

                  </div>
                </div>

                {/* Dashboard del Estado del Presupuesto */}
              {/* Dashboard del Estado del Presupuesto */}
                <div className="presupuesto-dashboard">
                  <div className="dash-item">
                    <span className="dash-label">Límite Global</span>
                    <span className="dash-value">
                      ${Number(limiteEmpresarial).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="dash-item">
                    <span className="dash-label">Total Asignado</span>
                    <span className={`dash-value ${esExcedido ? 'text-danger' : 'text-success'}`}>
                      ${(Number(sumaTotalAsignada) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="dash-item">
                    <span className="dash-label">{esExcedido ? 'Excedido' : 'Disponible'}</span>
                    <span className={`dash-value ${esExcedido ? 'text-danger' : 'text-primary'}`}>
                      ${(Math.abs(Number(limiteEmpresarial) - Number(sumaTotalAsignada)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          <span className={`badge-estado ${emp.estado.toLowerCase()}`}>
                          {emp.estado}
                        </span>

                        </td>
                        <td className="col-monto">
                          <div className="cell-input-wrapper">
                            <span className="cell-currency">$</span>
                            <input 
                              type="number" 
                              min="0"
                              className="user-limit-input"
                              value={emp.limiteGasto === 0 ? '' : emp.limiteGasto} 
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
      <ModalConfirmacion
        isOpen={modalConfirmOpen}
        type="warning"
        title="Confirmar acción"
        message="¿Estás seguro de que deseas guardar los cambios en los límites de gasto?"
        subMessage="Esta acción modificará la configuración empresarial y de los empleados."
        onConfirm={ejecutarGuardarCambios}
        onClose={() => setModalConfirmOpen(false)}
      />
    </div>
  );
}

export default Gastos;
