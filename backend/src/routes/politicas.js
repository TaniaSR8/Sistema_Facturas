const express = require("express");
const router = express.Router();
const politicasController = require("../controllers/politicasController");

router.put("/actualizar", politicasController.actualizarPoliticas);


// Nuevo endpoint GET
router.get("/", politicasController.obtenerPoliticas);

module.exports = router;
