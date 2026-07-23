// backend/routes/gastos.js
const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ver el presupuesto: SUPERADMIN y ADMINISTRADOR (el admin solo lee,
// su frontend no tendrá ningún formulario de edición).
router.get('/obtener', authMiddleware(['SUPERADMIN', 'ADMINISTRADOR']), gastosController.obtenerPresupuesto);

// Editar el presupuesto: SOLO SUPERADMIN. Aunque alguien intente llamar
// este endpoint directamente (Postman, DevTools, etc.), el backend
// rechaza con 403 a cualquiera que no sea SUPERADMIN.
router.put('/actualizar', authMiddleware(['SUPERADMIN']), gastosController.actualizarPresupuesto);

module.exports = router;