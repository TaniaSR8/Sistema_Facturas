// import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios";
import "../css/USubirFoto.css";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ModalCerrarSesion from "../components/ModalCerrarSesion";
import { useToast } from "../components/Toast";

const TIPOS_GASTO = [
  { codigo: "G01", descripcion: "Adquisición de mercancías" },
  { codigo: "G02", descripcion: "Devoluciones, descuentos o bonificaciones" },
  { codigo: "G03", descripcion: "Gastos en general" },
  { codigo: "I01", descripcion: "Construcciones" },
  { codigo: "I02", descripcion: "Mobiliario y equipo de oficina" },
  { codigo: "I03", descripcion: "Equipo de transporte" },
  { codigo: "I04", descripcion: "Equipo de cómputo y accesorios" },
  { codigo: "S01", descripcion: "Sin efectos fiscales" },
  { codigo: "CP01", descripcion: "Pagos" },
];

const FORMAS_PAGO = [
  { codigo: "01", descripcion: "Efectivo" },
  { codigo: "02", descripcion: "Cheque nominativo" },
  { codigo: "03", descripcion: "Transferencia electrónica" },
  { codigo: "04", descripcion: "Tarjeta de crédito" },
  { codigo: "28", descripcion: "Tarjeta de débito" },
  { codigo: "99", descripcion: "Por definir" },
];

// Respaldo por si falla la carga desde el backend
// (debe coincidir con las filas reales de la tabla deduccion_factura)
const DEDUCCIONES_RESPALDO = [
  { id: 1, descripcion: "Blupster a Blupster" },
  { id: 2, descripcion: "Usuario pagó con tarjeta corporativa" },
  { id: 3, descripcion: "Usuario compró con su propia tarjeta y facturó a Usuario" },
  { id: 4, descripcion: "Usuario compró con tarjeta pero facturó a Blupster" },
];

const FORMATOS_PERMITIDOS = ["image/jpeg", "image/jpg", "image/png"];
const TAMANO_MAX_IMAGEN = 2 * 1024 * 1024; // 2MB

const esDispositivoMovil = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function USubirFoto() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    setModalCerrarSesionAbierto(false);
    addToast("Sesión cerrada con éxito", "success");
    navigate("/login");
  };

  // Mismo patrón de menú hamburguesa que PrincipalSuperAdmin
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Archivo / foto seleccionada
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Cámara nativa del celular
  const inputCamaraRef = useRef(null);
  const [esMovil] = useState(() => esDispositivoMovil());

  // Opciones de "Factura" (tabla deduccion_factura)
  const [deducciones, setDeducciones] = useState(DEDUCCIONES_RESPALDO);
  const [cargandoDeducciones, setCargandoDeducciones] = useState(true);

  // Formulario
  const [tipoGasto, setTipoGasto] = useState("G03");
  const [monto, setMonto] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [deduccionId, setDeduccionId] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Estado de envío
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    const cargarDeducciones = async () => {
      try {
        // TODO: ajustar la ruta real de tu API para listar deduccion_factura
        const { data } = await api.get("/deducciones/listar");
        if (Array.isArray(data) && data.length > 0) {
          setDeducciones(data);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las deducciones desde el backend, usando respaldo local.", err);
        setDeducciones(DEDUCCIONES_RESPALDO);
      } finally {
        setCargandoDeducciones(false);
      }
    };
    cargarDeducciones();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validarYAsignarArchivo = (file) => {
    setError("");
    if (!file) return;

    if (!FORMATOS_PERMITIDOS.includes(file.type)) {
      setError("Formato no permitido. Solo se aceptan imágenes JPG o PNG.");
      return;
    }
    if (file.size > TAMANO_MAX_IMAGEN) {
      setError("La imagen supera el tamaño máximo permitido (2MB).");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const manejarSeleccionArchivo = (e) => {
    const file = e.target.files?.[0];
    validarYAsignarArchivo(file);
    e.target.value = "";
  };

  const manejarDrop = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    validarYAsignarArchivo(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  const manejarDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const manejarDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  // Cámara nativa: al usar capture="environment" el sistema operativo
  // abre la app de cámara del celular directamente (no getUserMedia)
  const abrirCamaraNativa = () => {
    if (!esMovil) return;
    inputCamaraRef.current?.click();
  };

  const manejarFotoCamara = (e) => {
    const file = e.target.files?.[0];
    validarYAsignarArchivo(file);
    e.target.value = "";
  };

  const limpiarFormulario = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivo(null);
    setPreviewUrl(null);
    setTipoGasto("G03");
    setMonto("");
    setFormaPago("");
    setDeduccionId("");
    setDescripcion("");
    setError("");
    setExito("");
  };

  const manejarCancelar = () => {
    limpiarFormulario();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!archivo) {
      setError("Debes tomar una foto o subir un archivo.");
      addToast("Debes tomar una foto o subir un archivo.", "error");
      return;
    }
    if (!monto || Number(monto) <= 0) {
      setError("Ingresa un monto válido.");
      addToast("Ingresa un monto válido.", "error");
      return;
    }
    if (!formaPago) {
      setError("Selecciona una forma de pago.");
      addToast("Selecciona una forma de pago.", "error");
      return;
    }
    if (!deduccionId) {
      setError("Selecciona una opción de factura.");
      addToast("Selecciona una opción de factura.", "error");
      return;
    }

    // TODO: ajustar según cómo guardes el id del usuario logueado
     const usuarioId = localStorage.getItem("usuarioId");
    //const usuarioId = 7; // o el id real que tengas en tu tabla usuarios

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", archivo);
    formData.append("usuarioId", usuarioId || "");
    formData.append("descripcion", descripcion);
    formData.append("tipo_gasto_codigo", tipoGasto);
    formData.append("forma_pago_codigo", formaPago);
    formData.append("monto", monto);
    formData.append("deduccion_id", deduccionId);

    setEnviando(true);
    try {
      // TODO: ajustar la ruta si tu backend usa otro prefijo (ej: '/api/fotos/subir')
      await api.post("/fotos/subir", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setExito("Foto guardada correctamente.");
      addToast("Foto guardada correctamente.", "success");
      limpiarFormulario();
    } catch (err) {
      const msg = obtenerMensajeErrorApi ? obtenerMensajeErrorApi(err) : "Error al guardar la foto.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="panel-container">
      {/* ---------- Sidebar (mismo patrón que PrincipalSuperAdmin) ---------- */}
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

        <nav className={`sidebar-menu ${menuAbierto ? "show" : ""}`}>
       <button className="menu-item active" onClick={() => navigate("/usuario/foto-ticket")}>
            <div className="menu-icon inicio"></div>
            Inicio
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/factura")}>
            <div className="menu-icon facturas"></div>
            Facturas
          </button>
          <button className="menu-item" onClick={() => navigate("/usuario/dashboard")}>
  <div className="menu-icon dashboard"></div>
  Dashboard
</button>
         <button className="menu-item" onClick={() => navigate("/usuario/mis-fotografias")}>
              <div className="menu-icon fotos"></div>
              Mis Fotografías
            </button>
          <button className="menu-item" onClick={() => navigate("/perfil")}>
            <div className="menu-icon perfil"></div>
            Mi Perfil
          </button>
        </nav>
        <button className="sidebar-logout" onClick={() => setModalCerrarSesionAbierto(true)}>
          <div className="logout-icon"></div>
          Cerrar Sesión
        </button>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar usf-topbar">
          <h1 className="usf-topbar-titulo">Bienvenido</h1>
        </div>

        <main className="panel-main">
          <p className="usf-subtitulo">Gestione sus comprobantes de manera segura y eficiente.</p>

          <form className="usf-card" onSubmit={manejarSubmit}>
            {error && <div className="usf-alerta usf-alerta--error">{error}</div>}
            {exito && <div className="usf-alerta usf-alerta--exito">{exito}</div>}

            <div className="usf-grid">
              {/* Columna izquierda: Captura rápida */}
              <div className="usf-columna usf-columna-camara">
                <span className="usf-etiqueta-seccion">Captura Rápida</span>

                {/* Este wrapper crece para llenar el alto disponible de la columna
                    (igual al alto de la columna del formulario, que es más alta)
                    y centra el botón dentro de ese espacio, sin usar valores fijos. */}
                <div className="usf-camara-wrapper">
                  <button
                    type="button"
                    className={`usf-boton-camara ${!esMovil ? "usf-boton-camara--desactivado" : ""}`}
                    onClick={abrirCamaraNativa}
                    disabled={!esMovil}
                    title={!esMovil ? "Disponible solo en dispositivos móviles" : undefined}
                    aria-disabled={!esMovil}
                  >
                    {!esMovil && <span className="usf-boton-camara-candado">🔒</span>}
                    <span className="usf-boton-camara-icono">📷</span>
                    <span className="usf-boton-camara-titulo">Tomar Foto</span>
                    <span className="usf-boton-camara-subtitulo">
                      {esMovil ? "Usa la cámara de tu celular" : "Disponible en celular"}
                    </span>
                  </button>

                  {esMovil && (
                    <input
                      ref={inputCamaraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="usf-input-oculto"
                      onChange={manejarFotoCamara}
                    />
                  )}
                </div>
              </div>

              {/* Columna derecha: Archivo + todos los campos del formulario */}
              <div className="usf-columna usf-columna-formulario">
                <span className="usf-etiqueta-seccion">Archivo</span>

                <label
                  className={`usf-dropzone ${arrastrando ? "usf-dropzone--activo" : ""} ${previewUrl ? "usf-dropzone--con-preview" : ""}`}
                  onDrop={manejarDrop}
                  onDragOver={manejarDragOver}
                  onDragLeave={manejarDragLeave}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="usf-input-archivo"
                    onChange={manejarSeleccionArchivo}
                  />

                  {previewUrl ? (
                    <img src={previewUrl} alt="Vista previa" className="usf-preview" />
                  ) : (
                    <>
                      <span className="usf-dropzone-icono">⬆️</span>
                      <span className="usf-dropzone-titulo">Subir Archivo</span>
                      <span className="usf-dropzone-subtitulo">Arrastra aquí o haz clic para explorar</span>
                      <span className="usf-badge">FORMATOS: JPG, PNG</span>
                      <span className="usf-dropzone-nota">Tamaño máx: 2MB (Imágenes)</span>
                    </>
                  )}
                </label>
                {archivo && (
                  <button
                    type="button"
                    className="usf-quitar-archivo"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setArchivo(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Quitar archivo
                  </button>
                )}

                {/* Campos del formulario, apilados debajo del dropzone, en la misma columna */}
                <div className="usf-campos">
                  <div className="usf-campo">
                    <label htmlFor="tipoGasto">Tipo de Gasto</label>
                    <select id="tipoGasto" value={tipoGasto} onChange={(e) => setTipoGasto(e.target.value)}>
                      {TIPOS_GASTO.map((t) => (
                        <option key={t.codigo} value={t.codigo}>{t.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div className="usf-campo">
                    <label htmlFor="monto">Monto</label>
                    <div className="usf-input-monto">
                      <span>$</span>
                      <input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="usf-campo">
                    <label htmlFor="formaPago">Forma de Pago <span className="usf-requerido">*</span></label>
                    <select id="formaPago" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                      <option value="">Seleccionar</option>
                      {FORMAS_PAGO.map((f) => (
                        <option key={f.codigo} value={f.codigo}>{f.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div className="usf-campo">
                    <label htmlFor="factura">Factura <span className="usf-requerido">*</span></label>
                    <select
                      id="factura"
                      value={deduccionId}
                      onChange={(e) => setDeduccionId(e.target.value)}
                      disabled={cargandoDeducciones}
                    >
                      <option value="">{cargandoDeducciones ? "Cargando..." : "Seleccionar"}</option>
                      {deducciones.map((d) => (
                        <option key={d.id} value={d.id}>{d.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div className="usf-campo usf-campo--completo">
                    <label htmlFor="descripcion">Descripción (opcional)</label>
                    <input
                      id="descripcion"
                      type="text"
                      placeholder="Ej: Cena con cliente Proyecto X"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="usf-acciones">
              <button type="button" className="usf-btn usf-btn--secundario" onClick={manejarCancelar} disabled={enviando}>
                Cancelar
              </button>
              <button type="submit" className="usf-btn usf-btn--primario" disabled={enviando}>
                {enviando ? "Subiendo..." : "⬆ Subir"}
              </button>
            </div>
          </form>
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

export default USubirFoto;