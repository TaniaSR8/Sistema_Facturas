const express = require("express");
const router = express.Router();
const { register, login, getUsuarios, updateUsuario  } = require("../controllers/usuariosController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rutas de autenticación
router.post("/register", register);
router.post("/login", login);

// Nueva ruta para listar usuarios
router.get("/", getUsuarios);


// Nueva ruta para INACTIVO/ACTIVO
router.put("/:id", updateUsuario);

module.exports = router;
