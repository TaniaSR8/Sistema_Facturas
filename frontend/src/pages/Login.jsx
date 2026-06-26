import React, { useState } from "react";
import "../css/Login.css";

import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom"; // 1. Importamos Link para la navegación interna
import api from "../axios"; // Importo AXIOS
import { useNavigate } from "react-router-dom";

const obtenerRolDesdeToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.rol || null;
  } catch {
    return null;
  }
};

function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [tocadoCorreo, setTocadoCorreo] = useState(false);
  const [tocadoContrasena, setTocadoContrasena] = useState(false);
  const navigate = useNavigate();


  const manejarSubmit = async (e) => {
  e.preventDefault();

  if (correo.trim() === "" || contrasena.trim() === "") {
    setMensaje("Los campos no pueden estar vacíos");
    return;
  }

  try {
    const response = await api.post("/usuarios/login", {
      correo: correo,
      contrasena: contrasena,
    });

    const token = response.data.token;
    if (!token) {
      setMensaje("No se recibió token del servidor");
      return;
    }

    const rol = (response.data.rol || obtenerRolDesdeToken(token) || "").toUpperCase();

    localStorage.setItem("token", token);
    localStorage.setItem("rol", rol);
    localStorage.setItem("correo", correo);

    if (rol === "SUPERADMIN") {
      navigate("/usuarios");
    } else if (rol === "ADMINISTRADOR") {
      navigate("/perfil");
    } else {
      setMensaje("Tu rol no tiene acceso al sistema");
    }
  } catch (error) {
    setMensaje(
      error.response?.data?.error ||
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        "Credenciales inválidas"
    );
  }
};


  return (
    <div className="login-contenedor">
      <div className="login-caja">
        
        {/* Encabezado con tu logotipo corregido para que no se corte */}
        <div className="login-encabezado">
          <div className="icono-principal-contenedor">
            <img 
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAACXBIWXMAAAsTAAALEwEAmpw
              YAAACYklEQVR4nO2dMU4UcRjFnxRsAQFPoXsCQoS9gCZ6ByI1hoaChnLlEBScQguwMHoENRRq4S5yAqCAz0zyN1HjDMzs/L958
              +37Ja8hYXi/l92ZYUkGQAghhBBCCCHmgEUArwFMAVjQTACMk2tnjAmGMKcUrp0R+ZVs/+S8y6FtztIZXYubhkbI0A3dd+i86Ap
              F9aIrFNWLrlBUL7pCUb3oCkX1oisU1YuuUFQvukJRvWYpZDW/11pKbq8saGgnNLQTGtoJDe2EhnaCrlBUL7pCUb3oCkX1oisU1
              YuuUFQvukJRvXR754TGdkJDO6GhndDQTmhoJ+gKRfWiKxTVi65QVC+6QlG96ApF9aIrFNVLt3dOaGgnNLQTGtoJDe2EhnaCrlB
              UL7pCUb3oCkX1oisU1YuuUFQvukJRvegKRfWiKxTVi65QH7368gSwSYaneLkOPZ7jp3iZ59Dsr2TL+BQv16GvCcazmlluwXul5
              NhXyMQFwXBWM49a8H7s8I75i48Ew1nNbLXgvV1y7PfIxCHBcFYzb1rwfuv9yMwNguGsQTZncB5VHHcdmVhI5yXrWT4BWG3g+xD
              Al5JjTtMe2dglGM4a5KTm2MXIpxXH20FmBgC+EQxnDfL5nqeRUcUrucjXtEN2XgC4JRjOZrhAvgQwBLCUMkxfK7vw/c4NgGdw5
              IBgMOsg+3DmAYBjAnFzzFHydqf4oXvp7WSBc5vewZ2M/CfPe3yBtDtyBuApiBikW78+3mfbf/IdwKuu/zNFFcVN/JP06/oHAD9
              78KnfJYAfAN6lP2ysMZwmhBBCCCGEEAKe/AIbTQlb/l4evwAAAABJRU5ErkJoggling==" 
              alt="Purchase Order Logo" 
              className="logo-factura"
            />
          </div>
          <div className="texto-encabezado">
            <h2>Bienvenido</h2>
            <p>Inicia sesión para acceder a tu cuenta.</p>
          </div>
        </div>

        <form onSubmit={manejarSubmit}>
          {/* Campo Correo */}
          <div className="grupo">
            <label>Correo *</label>
            <div className="input-icono-contenedor">
              <Mail className="icono-izquierdo" size={18} />
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

          {/* Campo Contraseña */}
          <div className="grupo">
            <label>Contraseña *</label>
            <div className="input-icono-contenedor">
              <Lock className="icono-izquierdo" size={18} />
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                onBlur={() => setTocadoContrasena(true)}
                className={
                  !tocadoContrasena
                    ? ""
                    : contrasena.trim() === ""
                    ? "invalido"
                    : "valido"
                }
              />
              <div
                className="password-icono"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
              >
                {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          {/* Enlace de recuperación */}
          <div className="olvido-contenedor">
            {/* 2. Reemplazamos <a> por <Link to="..."> apuntando a tu ruta de App.jsx */}
            <Link to="/recuperar-contrasena" className="olvido-contrasena">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón de Iniciar Sesión */}
          <button type="submit" className="btn-enviar">Iniciar Sesión</button>

          {mensaje && <p className="mensaje">{mensaje}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;