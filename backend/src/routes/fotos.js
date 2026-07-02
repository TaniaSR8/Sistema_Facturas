const express = require('express');
const multer = require('multer');
const conexionBD = require('../config/db'); // conexión correcta

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // carpeta fuera de src
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Endpoint para subir foto con campos extra
router.post('/subir', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió archivo. El campo debe llamarse 'file'." });
    }

    const { usuarioId, descripcion, tipo_gasto_codigo, forma_pago_codigo } = req.body;
    const rutaArchivo = req.file.path;

    const sql = 'INSERT INTO fotos_ticket (usuario_id, descripcion, ruta, tipo_gasto_codigo, forma_pago_codigo) VALUES (?, ?, ?, ?, ?)';

    try {
        const [resultados] = await conexionBD.query(sql, [usuarioId, descripcion, rutaArchivo, tipo_gasto_codigo, forma_pago_codigo]);
        return res.json({ mensaje: 'Foto guardada correctamente', ruta: rutaArchivo });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error al guardar la foto');
    }
});

module.exports = router;