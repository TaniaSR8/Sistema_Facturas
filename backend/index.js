require("dotenv").config(); //  carga variables de .env
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());            //  habilita comunicación con frontend
app.use(express.json());    //  parsea JSON en requests

// Importar conexión
const pool = require("./src/config/db");

// Importar rutas
const usuariosRoutes = require("./src/routes/usuarios");
app.use("/api/usuarios", usuariosRoutes);

// Importar rutas de gastos
const gastosRoutes = require("./src/routes/gastos");
app.use("/api/gastos", gastosRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando ");
});

// Ruta de prueba para verificar conexión
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la conexión a la BD" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
