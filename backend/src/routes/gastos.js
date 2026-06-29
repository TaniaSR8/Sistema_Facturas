// backend/routes/gastos.js
const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');

// Ruta para obtener presupuesto global y usuarios
router.get('/obtener', gastosController.obtenerPresupuesto);

// Ruta para actualizar presupuesto global y usuarios
router.put('/actualizar', gastosController.actualizarPresupuesto);

module.exports = router;
