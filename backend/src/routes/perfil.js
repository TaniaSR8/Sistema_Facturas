const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

// Obtener perfil por correo
router.get('/', perfilController.obtenerPerfil);

// Actualizar datos del perfil
router.put('/actualizar', perfilController.actualizarPerfil);

// Cambiar contraseña
router.put('/cambiar-contrasena', perfilController.cambiarContrasena);

module.exports = router;
