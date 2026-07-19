const express = require('express');
const router = express.Router();
const multer = require('multer');
const conexionBD = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware(['ADMINISTRADOR']));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ============================================================================
// POST /api/ventas-mensuales/subir
// Carga manual del administrador. No se parsea el XML (a diferencia de las
// facturas de gastos), solo se guarda como respaldo/adjunto.
// ============================================================================
router.post('/subir', upload.fields([{ name: 'xml' }, { name: 'pdf' }]), async (req, res) => {
    try {
        const { fecha, ingresosTotales, origen, rfc, subtotal, iva, montoTotal } = req.body;
        const xmlFile = req.files['xml'] ? req.files['xml'][0] : null;
        const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

        if (!fecha || !ingresosTotales || !origen || !rfc || !subtotal || !iva || !montoTotal) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        if (!xmlFile || !pdfFile) {
            return res.status(400).json({ error: "Debes adjuntar el archivo XML y el PDF" });
        }
        if (!['NACIONAL', 'EXTRANJERO'].includes(origen)) {
            return res.status(400).json({ error: "Origen inválido" });
        }

        const usuarioId = req.usuario.id; // viene del token (authMiddleware)

        const [resultado] = await conexionBD.query(
            `INSERT INTO ventas_mensuales
             (fecha, ingresos_totales, origen, rfc, subtotal, iva, monto_total, xml_path, pdf_path, creado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [fecha, ingresosTotales, origen, rfc, subtotal, iva, montoTotal, xmlFile.path, pdfFile.path, usuarioId]
        );

        res.json({ mensaje: "Reporte de ventas guardado correctamente", id: resultado.insertId });
    } catch (error) {
        console.error("❌ Error al guardar venta mensual:", error);
        res.status(500).json({ error: "Error al guardar el reporte de ventas" });
    }
});

// ============================================================================
// GET /api/ventas-mensuales/listar?filtro=este-mes|mes-anterior|todos&pagina=&porPagina=
// ============================================================================
router.get('/listar', async (req, res) => {
    try {
        const { filtro = 'este-mes', pagina = 1, porPagina = 10 } = req.query;

        let sql = `
            SELECT id, fecha, ingresos_totales, origen, rfc, subtotal, iva, monto_total, xml_path, pdf_path
            FROM ventas_mensuales
            WHERE 1 = 1
        `;
        const params = [];

        if (filtro === 'este-mes') {
            sql += ' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())';
        } else if (filtro === 'mes-anterior') {
            sql += ' AND YEAR(fecha) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(fecha) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
        }
        // filtro === 'todos' no agrega condición

        sql += ' ORDER BY fecha DESC';

        const [todas] = await conexionBD.query(sql, params);

        const porPaginaNum = Number(porPagina) || 10;
        const paginaNum = Number(pagina) || 1;
        const inicio = (paginaNum - 1) * porPaginaNum;
        const pagina_datos = todas.slice(inicio, inicio + porPaginaNum);

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const resultado = pagina_datos.map((r) => ({
            id: r.id,
            fecha: r.fecha,
            ingresosTotales: r.ingresos_totales,
            origen: r.origen,
            rfc: r.rfc,
            subtotal: r.subtotal,
            iva: r.iva,
            montoTotal: r.monto_total,
            xmlUrl: `${baseUrl}/${r.xml_path}`,
            pdfUrl: `${baseUrl}/${r.pdf_path}`,
        }));

        res.json({ ventas: resultado, total: todas.length });
    } catch (error) {
        console.error("❌ Error al listar ventas mensuales:", error);
        res.status(500).json({ error: "Error al listar el reporte de ventas" });
    }
});

module.exports = router;