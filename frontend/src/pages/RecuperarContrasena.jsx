import React, { useState } from "react";
import "../css/RecuperarContrasena.css";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom"; // Importamos Link para navegación interna

function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tocadoCorreo, setTocadoCorreo] = useState(false);

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (correo.trim() === "") {
      setMensaje("El campo de correo electrónico no puede estar vacío");
      return;
    }
    console.log("Enviar correo de recuperación a:", correo);
    setMensaje("Si el correo está registrado, recibirás un código pronto.");
  };

  return (
    <div className="recuperar-contenedor">
      {/* Título exterior del sistema */}
      <h1 className="titulo-sistema">Sistema de Control de Facturas</h1>

      <div className="recuperar-caja">
        {/* Encabezado interno de la tarjeta */}
        <div className="recuperar-encabezado">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>
            Ingresa tu correo electronico para recibir un código de recuperación
          </p>
        </div>

        <form onSubmit={manejarSubmit}>
          {/* Campo Correo electrónico */}
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
                className={
                  !tocadoCorreo ? "" : correo.trim() === "" ? "invalido" : "valido"
                }
              />
            </div>
          </div>

          {/* Botón enviar correo */}
          <button type="submit" className="btn-recuperar">
            <span>Enviar Correo de Recuperación</span>
            <ArrowRight className="icono-boton-derecho" size={18} />
          </button>

          {mensaje && <p className="mensaje-recuperar">{mensaje}</p>}
        </form>

        {/* Línea divisoria */}
        <hr className="divisor-recuperar" />

        {/* Enlace para regresar usando Link en vez de <a> */}
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