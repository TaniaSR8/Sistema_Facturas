import React, { useState, useEffect } from "react";
import "../css/RestablecerContrasena.css";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api, { obtenerMensajeErrorApi } from "../axios";

// Políticas de respaldo, solo por si el backend no responde (no debería pasar,
// pero así el formulario no se rompe)
const POLITICAS_RESPALDO = {
  longitudMinima: 8,
  longitudMaxima: 16,
  minNumeros: 1,
  minMayusculas: 1,
  minMinusculas: 1,
  minEspeciales: 1,
};

function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  // 👇 Ya NO están fijas: se cargan del Superadmin (config_seguridad)
  const [politicas, setPoliticas] = useState(POLITICAS_RESPALDO);
  const [cargandoPoliticas, setCargandoPoliticas] = useState(true);

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setTokenValido(false);
        setValidandoToken(false);
        return;
      }
      try {
        const { data } = await api.get("/usuarios/validar-token-recuperacion", {
          params: { token },
        });
        setTokenValido(Boolean(data.valido));
        if (!data.valido) setMensaje(data.error || "El enlace no es válido.");
      } catch (err) {
        setTokenValido(false);
        setMensaje(obtenerMensajeErrorApi(err));
      } finally {
        setValidandoToken(false);
      }
    };

    const cargarPoliticas = async () => {
      try {
        const { data } = await api.get("/politicas");
        if (data.politicas) {
          setPoliticas(data.politicas);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las políticas de seguridad, usando valores de respaldo.", err);
      } finally {
        setCargandoPoliticas(false);
      }
    };

    validarToken();
    cargarPoliticas();
  }, [token]);

  // Validaciones en tiempo real, calculadas contra las políticas REALES del Superadmin
  const tieneLongitudMinima = nuevaClave.length >= politicas.longitudMinima;
  const tieneLongitudMaxima = nuevaClave.length <= politicas.longitudMaxima;
  const tieneMayusculas = (nuevaClave.match(/[A-Z]/g) || []).length >= politicas.minMayusculas;
  const tieneMinusculas = (nuevaClave.match(/[a-z]/g) || []).length >= politicas.minMinusculas;
  const tieneNumeros = (nuevaClave.match(/[0-9]/g) || []).length >= politicas.minNumeros;
  const tieneEspeciales = (nuevaClave.match(/[^A-Za-z0-9]/g) || []).length >= politicas.minEspeciales;

  const cumpleTodo =
    tieneLongitudMinima &&
    tieneLongitudMaxima &&
    tieneMayusculas &&
    tieneMinusculas &&
    tieneNumeros &&
    tieneEspeciales;

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!cumpleTodo) {
      setMensaje("La contraseña no cumple con los requisitos definidos por el Administrador.");
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post("/usuarios/restablecer-contrasena", {
        token,
        nuevaContrasena: nuevaClave,
      });
      setMensaje(data.mensaje || "¡Tu contraseña ha sido actualizada correctamente!");
      setExito(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setMensaje(obtenerMensajeErrorApi(err));
    } finally {
      setEnviando(false);
    }
  };

  if (validandoToken || cargandoPoliticas) {
    return (
      <div className="restablecer-contenedor">
        <div className="restablecer-caja">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="restablecer-contenedor">
        <div className="restablecer-caja">
          <div className="restablecer-encabezado">
            <h2>Enlace no válido</h2>
            <p>{mensaje || "Este enlace de recuperación ya no es válido o ha expirado."}</p>
          </div>
          <div className="restablecer-volver-contenedor">
            <Link to="/recuperar-contrasena" className="enlace-restablecer-volver">
              Solicitar un nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                placeholder={`Entre ${politicas.longitudMinima} y ${politicas.longitudMaxima} caracteres`}
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                className="input-restablecer-campo"
                disabled={enviando || exito}
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
                disabled={enviando || exito}
              />
              <div
                className="restablecer-icono-ojo"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
              >
                {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          {/* 👇 Ahora refleja exactamente las 6 reglas que el Superadmin configuró */}
          <div className="restablecer-requisitos-caja">
            <div className={`requisito-linea ${tieneLongitudMinima && tieneLongitudMaxima ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Entre {politicas.longitudMinima} y {politicas.longitudMaxima} caracteres</span>
            </div>
            <div className={`requisito-linea ${tieneMayusculas ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Al menos {politicas.minMayusculas} letra(s) mayúscula(s)</span>
            </div>
            <div className={`requisito-linea ${tieneMinusculas ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Al menos {politicas.minMinusculas} letra(s) minúscula(s)</span>
            </div>
            <div className={`requisito-linea ${tieneNumeros ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Al menos {politicas.minNumeros} número(s)</span>
            </div>
            <div className={`requisito-linea ${tieneEspeciales ? "cumplido" : ""}`}>
              <CheckCircle2 size={16} />
              <span>Al menos {politicas.minEspeciales} símbolo(s) especial(es)</span>
            </div>
          </div>

          <button type="submit" className="btn-restablecer-guardar" disabled={enviando || exito}>
            {enviando ? "Guardando..." : "Guardar nueva contraseña"}
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