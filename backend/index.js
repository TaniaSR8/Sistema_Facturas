const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Servidor backend funcionando ");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
