import React, { useState } from "react";
import "../css/RestablecerContrasena.css";
import { Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

function RestablecerContrasena() {
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // Simulación de políticas dinámicas del Superadmin
  const politicasSeguridad = {
    minCaracteres: 12,
    requiereSimbolosYNumeros: true
  };

  const tieneMinimoCaracteres = nuevaClave.length >= politicasSeguridad.minCaracteres;
  
  const tieneSimbolosYNumeros = politicasSeguridad.requiereSimbolosYNumeros
    ? /(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_])/.test(nuevaClave)
    : true;

  const manejarSubmit = (e) => {
    e.preventDefault();

    if (!tieneMinimoCaracteres || !tieneSimbolosYNumeros) {
      setMensaje("La contraseña no cumple con los requisitos definidos por el Administrador.");
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    console.log("Contraseña restablecida con éxito");
    setMensaje("¡Tu contraseña ha sido actualizada correctamente!");
  };

  return (
    <div className="restablecer-contenedor">
      <div className="restablecer-caja">
        
        <div className="restablecer-encabezado">
          <h2>Crea tu nueva contraseña</h2>
          <p>
            La contraseña debe cumplir las reglas definidas por 
            el Superadministrador para garantizar la seguridad 
            de tu cuenta.
          </p>
        </div>

        <form onSubmit={manejarSubmit}>
          
          <div className="grupo-restablecer">
            <label>Nueva contraseña</label>
            <div className="input-restablecer-contenedor">
              <input
                type={mostrarNueva ? "text" : "password"}
                placeholder={"Mínimo " + politicasSeguridad.minCaracteres + " caracteres"}
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                className="input-restablecer-campo"
              />
              <div 
                className="restablecer-icono-ojo" 
                onClick={() => setMostrarNueva(!mostrarNueva)}
              >
                {mostrarNueva ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <div className="grupo-restablecer">
            <label>Confirmar nueva contraseña</label>
            <div className="input-restablecer-contenedor">
              <input
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Repetir nueva contraseña"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                className="input-restablecer-campo"
              />
              <div 
                className="restablecer-icono-ojo" 
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
              >
                {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <div className="restablecer-requisitos-caja">
            <div className={`requisito-linea ${tieneMinimoCaracteres ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Al menos {politicasSeguridad.minCaracteres} caracteres</span>
            </div>

            {politicasSeguridad.requiereSimbolosYNumeros && (
              <div className={`requisito-linea ${tieneSimbolosYNumeros ? "cumplido" : ""}`}>
                <CheckCircle2 size={16} />
                <span>Símbolos y números incluidos</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn-restablecer-guardar">
            Guardar nueva contraseña
          </button>
        </form>

        {mensaje && <p className="mensaje-restablecer-alerta">{mensaje}</p>}

        <div className="restablecer-volver-contenedor">
          <Link to="/login" className="enlace-restablecer-volver">
            Volver al login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default RestablecerContrasena;