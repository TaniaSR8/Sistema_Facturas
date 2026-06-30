const db = require("../config/db");

exports.actualizarPoliticas = async (req, res) => {
    try {
        const { longitudMinima, longitudMaxima, minNumeros, minMayusculas, minMinusculas, minEspeciales, configuradoPor } = req.body;
        await db.query(
            "INSERT INTO config_seguridad (longitudMinima, longitudMaxima, minNumeros, minMayusculas, minMinusculas, minEspeciales, configuradoPor) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [longitudMinima, longitudMaxima, minNumeros, minMayusculas, minMinusculas, minEspeciales, configuradoPor]
        );
        res.json({ politicas: req.body });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar políticas" });
    }
};


// Nuevo controlador GET
exports.obtenerPoliticas = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM config_seguridad ORDER BY id DESC LIMIT 1");
        if (rows.length > 0) {
            res.json({ politicas: rows[0] });
        } else {
            res.json({ politicas: null });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al obtener políticas" });
    }
};
