import React, { useState, useRef } from "react";
import "../css/codigoOtp.css";
import { ShieldCheck, CheckCircle2, Info } from "lucide-react";

function CodigoOtp() {
  // Estado para guardar los 6 dígitos por separado
  const [codigos, setCodigos] = useState(["", "", "", "", "", ""]);
  const [mensaje, setMensaje] = useState("");
  
  // Referencias para controlar el salto automático entre inputs
  const inputsRef = useRef([]);

  const manejarCambio = (valor, indice) => {
    // Permitir solo números
    if (isNaN(valor)) return;

    const nuevosCodigos = [...codigos];
    // Tomar solo el último carácter ingresado
    nuevosCodigos[indice] = valor.substring(valor.length - 1);
    setCodigos(nuevosCodigos);

    // Si se escribió un número y no es el último cuadro, saltar al siguiente
    if (valor && indice < 5) {
      inputsRef.current[indice + 1].focus();
    }
  };

  const manejarTeclaAbajo = (e, indice) => {
    // Si presiona "Borrar" (Backspace) y el cuadro está vacío, regresar al anterior
    if (e.key === "Backspace" && !codigos[indice] && indice > 0) {
      inputsRef.current[indice - 1].focus();
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    const codigoCompleto = codigos.join("");
    
    if (codigoCompleto.length < 6) {
      setMensaje("Por favor, ingresa el código completo de 6 dígitos.");
      return;
    }
    
    console.log("Código OTP ingresado para validar:", codigoCompleto);
    setMensaje("Verificando código...");
  };

  const manejarReenvio = (e) => {
    e.preventDefault();
    console.log("Solicitando reenvío de código...");
    alert("Se ha enviado un nuevo código a tu correo.");
  };

  return (
    <div className="otp-contenedor">
      <div className="otp-caja">
        {/* Icono de escudo superior */}
        <div className="otp-icono-escudo">
          <ShieldCheck size={42} color="#0059B3" />
        </div>

        {/* Encabezado */}
        <div className="otp-encabezado">
          <h2>Verifica tu identidad</h2>
          <p>Ingresa el código de 6 dígitos enviado a tu correo.</p>
        </div>

        {/* Formulario de los 6 bloques */}
        <form onSubmit={manejarSubmit}>
          <div className="otp-bloques-contenedor">
            {codigos.map((digito, indice) => (
              <input
                key={indice}
                type="text"
                maxLength="1"
                value={digito}
                ref={(el) => (inputsRef.current[indice] = el)}
                onChange={(e) => manejarCambio(e.target.value, indice)}
                onKeyDown={(e) => manejarTeclaAbajo(e, indice)}
                className="otp-input-cuadro"
                placeholder=""
              />
            ))}
          </div>

          {/* Botón Verificar */}
          <button type="submit" className="btn-otp-verificar">
            <span>Verificar</span>
            <CheckCircle2 size={18} />
          </button>
        </form>

        {/* Enlace de reenvío */}
        <div className="otp-reenviar-contenedor">
          <a href="#" onClick={manejarReenvio} className="enlace-otp-reenviar">
            Reenviar código
          </a>
        </div>

        {mensaje && <p className="mensaje-otp-alerta">{mensaje}</p>}

        {/* Caja de información inferior (Spam) */}
        <div className="otp-caja-info">
          <Info size={18} className="icono-info-otp" />
          <p>Si no recibiste el correo, revisa tu carpeta de spam o solicita un nuevo código</p>
        </div>
      </div>
    </div>
  );
}

export default CodigoOtp;