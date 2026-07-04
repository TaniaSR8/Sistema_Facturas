// import { useRef, useState } from "react";
import api, { obtenerMensajeErrorApi } from "../axios";
import { useNavigate } from "react-router-dom";
import "../css/USubirFactura.css";

import React, { useState, useRef, useCallback, useEffect } from "react";

// Se llama como ruta relativa porque baseURL ya es http://localhost:3001/api
const ENDPOINT_FACTURA = "/facturas/subir";

export default function USubirFactura() {
  const navigate = useNavigate();

  const [archivoXml, setArchivoXml] = useState(null);
  const [archivoPdf, setArchivoPdf] = useState(null);

  const [datosFactura, setDatosFactura] = useState({
    emisor_rfc: "",
    emisor_nombre: "",
    fecha: "",
    subtotal: "",
    total: "",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false); // menú de 3 puntos de la tarjeta
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false); // hamburguesa del sidebar

  const inputXmlRef = useRef(null);
  const inputPdfRef = useRef(null);

  const handleSeleccionXml = (e) => {
    const archivo = e.target.files?.[0] || null;
    setArchivoXml(archivo);
    setError("");
    setExito("");
  };

  const handleSeleccionPdf = (e) => {
    const archivo = e.target.files?.[0] || null;
    setArchivoPdf(archivo);
    setError("");
    setExito("");
  };

  const limpiarFormulario = () => {
    setArchivoXml(null);
    setArchivoPdf(null);
    setDatosFactura({
      emisor_rfc: "",
      emisor_nombre: "",
      fecha: "",
      subtotal: "",
      total: "",
    });
    setError("");
    setExito("");
    if (inputXmlRef.current) inputXmlRef.current.value = "";
    if (inputPdfRef.current) inputPdfRef.current.value = "";
  };

  const handleCancelar = () => {
    limpiarFormulario();
    navigate(-1);
  };

  const handleSubir = async () => {
    setError("");
    setExito("");

    if (!archivoXml || !archivoPdf) {
      setError("Debes seleccionar el archivo XML y el archivo PDF antes de subir la factura.");
      return;
    }

    const usuarioId = localStorage.getItem("usuarioId");

          if (!usuarioId) {
        setError("Debes iniciar sesión para subir facturas.");
        return;
      }


    const formData = new FormData();
    formData.append("xml", archivoXml);
    formData.append("pdf", archivoPdf);
    formData.append("usuarioId", usuarioId);

    try {
      setCargando(true);
      const respuesta = await api.post(ENDPOINT_FACTURA, formData);

      const datos = respuesta.data.datos || {};
          setDatosFactura({
            emisor_rfc: datos.emisor_rfc || "",
            emisor_nombre: datos.emisor_nombre || "",
            fecha: datos.fecha || "",
            subtotal: datos.subtotal ?? "",
            total: datos.total ?? "",
          });


      setExito("Factura procesada correctamente. Verifica los datos antes de continuar.");
    } catch (err) {
      console.error("Error al subir la factura:", err);
      setError(obtenerMensajeErrorApi(err));
    } finally {
      setCargando(false);
    }
  };

  const tieneDatos = Boolean(
    datosFactura.emisor_rfc || datosFactura.emisor_nombre || datosFactura.fecha
  );

  return (
    <div className="panel-container">
      {/* ---------- Sidebar ---------- */}
      <aside className="panel-sidebar">
        <div className="sidebar-top-wrapper">
          <div className="sidebar-main-icon" />
          <div className="sidebar-header-text">
            <h2>Sistema de Control de Facturas</h2>
          </div>

          {/* Solo visible en pantallas <= 850px (ver media query en el CSS) */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuMovilAbierto((prev) => !prev)}
            aria-label="Abrir menú"
            aria-expanded={menuMovilAbierto}
          >
            {menuMovilAbierto ? "✕" : "☰"}
          </button>
        </div>

        <nav className={"sidebar-menu" + (menuMovilAbierto ? " show" : "")}>
          <button
            className="menu-item"
            onClick={() => {
              setMenuMovilAbierto(false);
              navigate("/usuario/foto-ticket");
            }}
          >
            <span className="menu-icon inicio" />
            Inicio
          </button>
          <button className="menu-item active">
            <span className="menu-icon facturas" />
            Facturas
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setMenuMovilAbierto(false);
              navigate("/dashboard");
            }}
          >
            <span className="menu-icon dashboard" />
            Dashboard
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setMenuMovilAbierto(false);
              navigate("/usuario/foto-ticket");
            }}
          >
            <span className="menu-icon fotos" />
            Mis Fotografías
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setMenuMovilAbierto(false);
              navigate("/perfil");
            }}
          >
            <span className="menu-icon perfil" />
            Mi Perfil
          </button>
        </nav>

        <button className="sidebar-logout" onClick={() => navigate("/login")}>
          <span className="logout-icon" />
          Cerrar Sesión
        </button>
      </aside>

      {/* ---------- Contenido principal ---------- */}
      <div className="main-wrapper">
        <div className="top-blue-bar" />

        <main className="panel-main">
          <div>
            <h1 className="usf-page-titulo">Sistema de Gestión de Facturas</h1>
            <p className="usf-page-subtitulo">Administra y valida los comprobantes fiscales.</p>
          </div>

          <div className="usf-alerta usf-alerta--advertencia">
            <span className="usf-alerta-icono">⚠️</span>
            <div className="usf-alerta-texto">
              <strong>Pendiente la emisión del recibo de los gastos.</strong>
              <span>
                Aviso generado 5 días antes del corte mensual. Por favor, cargue sus archivos a la
                brevedad.
              </span>
            </div>
          </div>

          {error && <div className="usf-alerta usf-alerta--error">{error}</div>}
          {exito && <div className="usf-alerta usf-alerta--exito">{exito}</div>}

          <section className="usf-card">
            <div className="usf-card-header">
              <h2>Nueva Factura</h2>
              <button
                className="usf-card-header-menu"
                onClick={() => setMenuAbierto((prev) => !prev)}
                aria-label="Más opciones"
              >
                ⋮
              </button>
            </div>

            <div className="usf-card-body">
              <div className="usf-uploads-grid">
                {/* ----- XML ----- */}
                <div>
                  <div className="usf-upload-etiqueta">
                    Comprobante XML <span className="usf-requerido">*</span>
                  </div>
                  <div
                    className={
                      "usf-upload-box" + (archivoXml ? " usf-upload-box--con-archivo" : "")
                    }
                  >
                    <input
                      ref={inputXmlRef}
                      type="file"
                      accept=".xml"
                      className="usf-upload-input"
                      onChange={handleSeleccionXml}
                    />
                    <span className="usf-upload-icono">🗎</span>
                    {archivoXml ? (
                      <span className="usf-upload-nombre-archivo">{archivoXml.name}</span>
                    ) : (
                      <>
                        <span className="usf-upload-titulo">Seleccionar XML</span>
                        <span className="usf-upload-subtitulo">Solo archivos .xml</span>
                      </>
                    )}
                  </div>
                </div>

                {/* ----- PDF ----- */}
                <div>
                  <div className="usf-upload-etiqueta">
                    Comprobante PDF <span className="usf-requerido">*</span>
                  </div>
                  <div
                    className={
                      "usf-upload-box" + (archivoPdf ? " usf-upload-box--con-archivo" : "")
                    }
                  >
                    <input
                      ref={inputPdfRef}
                      type="file"
                      accept=".pdf"
                      className="usf-upload-input"
                      onChange={handleSeleccionPdf}
                    />
                    <span className="usf-upload-icono">📄</span>
                    {archivoPdf ? (
                      <span className="usf-upload-nombre-archivo">{archivoPdf.name}</span>
                    ) : (
                      <>
                        <span className="usf-upload-titulo">Seleccionar PDF</span>
                        <span className="usf-upload-subtitulo">Solo archivos .pdf</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="usf-campos">
                <div className="usf-campo">
              <label>
                RFC <span className="usf-requerido">*</span>
              </label>
              <input
                type="text"
                placeholder="ABCD123456XY"
                value={datosFactura.emisor_rfc}
                readOnly
              />
            </div>

            <div className="usf-campo">
              <label>
                Razón Social <span className="usf-requerido">*</span>
              </label>
              <input
                type="text"
                placeholder="Nombre de la empresa"
                value={datosFactura.emisor_nombre}
                readOnly
              />
            </div>

            <div className="usf-campo usf-campo-fecha">
              <label>
                Fecha De Emisión <span className="usf-requerido">*</span>
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={datosFactura.fecha}
                readOnly
              />
              <span className="usf-campo-fecha-icono">📅</span>
            </div>

            <div className="usf-campo">
              <label>
                Total sin IVA <span className="usf-requerido">*</span>
              </label>
              <input
                type="text"
                placeholder="0.00"
                value={datosFactura.subtotal}
                readOnly
              />
            </div>

            <div className="usf-campo">
              <label>
                Total <span className="usf-requerido">*</span>
              </label>
              <input
                type="text"
                placeholder="0.00"
                value={datosFactura.total}
                readOnly
              />
            </div>

              </div>

              <div className="usf-acciones">
                <button
                  type="button"
                  className="usf-btn usf-btn--secundario"
                  onClick={handleCancelar}
                  disabled={cargando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="usf-btn usf-btn--primario"
                  onClick={handleSubir}
                  disabled={cargando}
                >
                  {cargando ? "Subiendo..." : <>☁ Subir</>}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}