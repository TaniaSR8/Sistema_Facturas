import React, { useState } from "react";
import "../css/RecuperarContrasena.css";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import api, { obtenerMensajeErrorApi } from "../axios"; // 👈 NUEVO

function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tocadoCorreo, setTocadoCorreo] = useState(false);
  const [enviando, setEnviando] = useState(false); // 👈 NUEVO

  const manejarSubmit = async (e) => { // 👈 ahora es async
    e.preventDefault();
    if (correo.trim() === "") {
      setMensaje("El campo de correo electrónico no puede estar vacío");
      return;
    }

    setEnviando(true); // 👈 NUEVO
    try {
      const { data } = await api.post("/usuarios/solicitar-recuperacion", {
        correo: correo.trim(),
      });
      setMensaje(data.mensaje || "Si el correo está registrado, recibirás un enlace de recuperación.");
    } catch (err) {
      setMensaje(obtenerMensajeErrorApi(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="recuperar-contenedor">
      <h1 className="titulo-sistema">Sistema de Control de Facturas</h1>

      <div className="recuperar-caja">
        <div className="recuperar-encabezado">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>
            Ingresa tu correo electronico para recibir un código de recuperación
          </p>
        </div>

        <form onSubmit={manejarSubmit}>
          <div className="grupo-recuperar">
            <label>Correo electrónico *</label>
            <div className="input-recuperar-contenedor">
              <Mail className="icono-izquierdo-recuperar" size={18} />
              <input
                type="email"
                placeholder="Ej. nombre@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                onBlur={() => setTocadoCorreo(true)}
                disabled={enviando} // 👈 NUEVO
                className={
                  !tocadoCorreo ? "" : correo.trim() === "" ? "invalido" : "valido"
                }
              />
            </div>
          </div>

          <button type="submit" className="btn-recuperar" disabled={enviando}> {/* 👈 disabled agregado */}
            <span>{enviando ? "Enviando..." : "Enviar Correo de Recuperación"}</span> {/* 👈 texto dinámico */}
            {!enviando && <ArrowRight className="icono-boton-derecho" size={18} />}
          </button>

          {mensaje && <p className="mensaje-recuperar">{mensaje}</p>}
        </form>

        <hr className="divisor-recuperar" />

        <div className="volver-login-contenedor">
          <Link to="/login" className="enlace-volver">
            <ArrowLeft size={16} />
            <span>Volver al login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecuperarContrasena;