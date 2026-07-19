const express = require("express");
const router = express.Router();
const { register, login, getUsuarios, updateUsuario  ,
    solicitarRecuperacion,
    validarTokenRecuperacion,
    restablecerContrasena} = require("../controllers/usuariosController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rutas de autenticación
router.post("/register", register);
router.post("/login", login);


// Recuperación de contraseña (rutas públicas, no llevan authMiddleware
// porque el usuario todavía no ha iniciado sesión en este punto)
router.post("/solicitar-recuperacion", solicitarRecuperacion);
router.get("/validar-token-recuperacion", validarTokenRecuperacion);
router.post("/restablecer-contrasena", restablecerContrasena);



// Nueva ruta para listar usuarios
router.get("/", getUsuarios);


// Nueva ruta para INACTIVO/ACTIVO
router.put("/:id", updateUsuario);

module.exports = router;
