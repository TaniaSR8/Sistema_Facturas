import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/PrincipalSuperAdmin.css';
import ModalAgregarUsuario from '../components/ModalAgregarUsuario';
import ModalCerrarSesion from '../components/ModalCerrarSesion';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import api, { obtenerMensajeErrorApi } from "../axios";

const mapearUsuarioBackend = (usuario) => {
const nombreCompleto = [usuario.nombre, usuario.apellidoPaterno, usuario.apellidoMaterno]
  .filter((parte) => parte && parte !== "NA")
  .join(" ")
  .trim();



  const estado = String(usuario.estado ?? "ACTIVO").toUpperCase();
  const activo =
    usuario.estado !== undefined
      ? !["INACTIVO", "0", "FALSE"].includes(estado)
      : typeof usuario.activo === "boolean"
      ? usuario.activo
      : true;

  return {
    ...usuario,
    num: usuario.num || usuario.numeroEmpleado || "",
    nombre: nombreCompleto || "",
    rfc: usuario.rfc || "",
    correo: usuario.correo || "",
    rol: (usuario.rol || "").toUpperCase(),
    activo,
  };
};

const esUsuarioGestionable = (usuario) =>
  usuario.rol === "ADMINISTRADOR" || usuario.rol === "USUARIO";

const prepararPayloadRegistro = (formulario) => {
  const partesNombre = formulario.nombre.trim().split(/\s+/);
  const nombre = partesNombre[0] || formulario.nombre.trim();
  const apellidoPaterno = partesNombre[1] || "NA";
  const apellidoMaterno = partesNombre.slice(2).join(" ") || "NA";

  const roles = {
    usuario: "USUARIO",
    administrador: "ADMINISTRADOR",
  };

  const estados = {
    activo: "ACTIVO",
    inactivo: "INACTIVO",
  };

  return {
    numeroEmpleado: formulario.noEmpleado.trim(),
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    correo: formulario.correo.trim().toLowerCase(),
    contrasena: formulario.password,
    rfc: formulario.rfc.trim().toUpperCase(),
    rol: roles[formulario.rol] || String(formulario.rol).toUpperCase(),
    telefono: formulario.telefono,
    estado: estados[formulario.estado] || String(formulario.estado).toUpperCase(),
  };
};

function PrincipalSuperAdmin() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuAbierto, setMenuAbierto] = useState(false); // Estado para el menú hamburguesa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const registrosPorPagina = 7;

  // Estado inicial vacío, ya no usamos localStorage ni datos quemados
const [empleados, setEmpleados] = useState([]);

const cargarUsuarios = async () => {
  const res = await api.get("/usuarios");
  const lista = Array.isArray(res.data) ? res.data : [];
  setEmpleados(lista.map(mapearUsuarioBackend));
};

useEffect(() => {
  cargarUsuarios().catch((error) => {
    console.error("Error al obtener usuarios:", error);
  });
}, []);

  

  // Hook listo para cargar desde backend al montar el componente
  useEffect(() => {
    const cargarGastosDesdeServidor = async () => {
      try {
        const respuesta = await fetch('http://localhost:3001/api/gastos/obtener');
        if (respuesta.ok) {
          const resultado = await respuesta.json();
          // Cuando el backend esté listo y retorne los empleados actualizados de la base de datos:
          if (resultado.empleados) {
            setEmpleados(resultado.empleados.map(mapearUsuarioBackend));
          }
        }
      } catch (error) {
        console.log("Servidor backend no disponible para obtener gastos. Usando persistencia local (localStorage).");
      }
    };
    cargarGastosDesdeServidor();
  }, []);

 const controlarToggle = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const usuario = empleados.find(emp => emp.id === id);
    const nuevoEstado = usuario.activo ? "INACTIVO" : "ACTIVO";

    const res = await api.put(`/usuarios/${id}`, { estado: nuevoEstado }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setEmpleados(prev =>
      prev.map(emp => emp.id === id ? mapearUsuarioBackend(res.data) : emp)
    );
  } catch (error) {
    console.error("Error al actualizar estado:", error);
  }
};



  const handleAgregarUsuario = async (nuevoUsuario) => {
    try {
      const payload = prepararPayloadRegistro(nuevoUsuario);
      await api.post("/usuarios/register", payload);
      await cargarUsuarios();
      alert("¡Usuario registrado correctamente!");
      return true;
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert(obtenerMensajeErrorApi(error));
      return false;
    }
  };


  const handleEditarUsuario = async (usuarioModificado) => {
  try {
    const token = localStorage.getItem("token");
    const res = await api.put(`/usuarios/${usuarioModificado.id}`, usuarioModificado, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEmpleados(prev =>
      prev.map(emp =>
        emp.id === usuarioModificado.id ? mapearUsuarioBackend(res.data) : emp
      )
    );
    alert("¡Usuario actualizado en el servidor!");
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    alert("Error al actualizar usuario en el servidor");
  }
};


  const handleCerrarSesion = () => {
  localStorage.removeItem("token");
  setModalCerrarSesionAbierto(false);
  navigate("/login"); // 👈 redirige directo
};


  const empleadosEnTabla = empleados.filter(esUsuarioGestionable);

  const empleadosFiltrados = empleadosEnTabla.filter((emp) => {
    const termino = busqueda.toLowerCase();
    return (
      (emp.nombre || "").toLowerCase().includes(termino) ||
      (emp.correo || "").toLowerCase().includes(termino) ||
      (emp.rfc || "").toLowerCase().includes(termino)
    );
  });

  const totalAdminsActivos = empleadosEnTabla.filter(
    (emp) => emp.activo && emp.rol === "ADMINISTRADOR"
  ).length;

  const totalUsuariosActivos = empleadosEnTabla.filter(
    (emp) => emp.activo && emp.rol === "USUARIO"
  ).length;

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
          <button className="menu-item active" onClick={() => navigate('/usuarios')}>
            <div className="menu-icon usuarios"></div>
            Gestión de Usuarios
          </button>
          <button className="menu-item" onClick={() => navigate('/gastos')}>
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
                        <span className={`badge-rol ${(emp.rol || "").toLowerCase()}`}>{emp.rol}</span>
                      </td>
                      <td className="col-estado">
                        <span className={`badge-estado ${emp.activo ? 'activo' : 'inactivo'}`}>
                          {emp.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="col-acciones">
                        <div className="action-buttons">
                          <button 
                            className="btn-action edit" 
                            title="Editar usuario"
                            onClick={() => {
                              setUsuarioSeleccionado(emp);
                              setIsEditModalOpen(true);
                            }}
                          ></button>
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
                <h3>ADMINISTRADORES ACTIVOS</h3><p>{totalAdminsActivos}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-info">
                <h3>USUARIOS ACTIVOS</h3><p>{totalUsuariosActivos}</p>
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
      <ModalCerrarSesion 
        isOpen={modalCerrarSesionAbierto} 
        onClose={() => setModalCerrarSesionAbierto(false)} 
        onConfirm={handleCerrarSesion}
      />
      <ModalEditarUsuario 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setUsuarioSeleccionado(null);
        }}
        usuario={usuarioSeleccionado}
        onSave={handleEditarUsuario}
      />
    </div>
  );
}

export default PrincipalSuperAdmin;