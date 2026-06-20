const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
app.use(usuariosRoutes);

// Importar conexión
const pool = require('./db');

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando");
});

// Ruta de prueba para verificar conexión
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la conexión a la BD' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});