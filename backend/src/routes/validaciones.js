const express = require('express');
const router = express.Router();
const fs = require('fs');
const conexionBD = require('../config/db'); // mismo pool mysql2/promise de siempre

// ---------------------------------------------------------------------------
// GET /api/validaciones/pendientes?q=busqueda
// Lista de facturas con estado PENDIENTE (aún no validadas por el admin)
// ---------------------------------------------------------------------------
router.get('/pendientes', async (req, res) => {
    try {
        const { q } = req.query;

        let sql = `
            SELECT 
                f.id,
                f.numeroFactura   AS folio,
                f.emisor_nombre   AS razonSocial,
                f.emisor_rfc      AS rfc,
                f.total           AS monto,
                df.descripcion    AS deduccion
            FROM facturas f
            LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
            WHERE f.estado = 'PENDIENTE'
        `;
        const params = [];

        if (q) {
            sql += ` AND (f.numeroFactura LIKE ? OR f.emisor_nombre LIKE ? OR f.emisor_rfc LIKE ?)`;
            const termino = `%${q}%`;
            params.push(termino, termino, termino);
        }

        sql += ' ORDER BY f.id DESC';

        const [rows] = await conexionBD.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("❌ Error al listar pendientes de validación:", error);
        res.status(500).json({ error: "Error al listar facturas pendientes" });
    }
});

// ---------------------------------------------------------------------------
// GET /api/validaciones/:id
// Detalle completo de una factura: datos fiscales + XML + URL del PDF
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await conexionBD.query(
            `SELECT 
                f.id,
                f.uuid            AS idTransaccion,
                f.fecha           AS fechaCarga,
                f.emisor_rfc      AS rfcEmisor,
                f.emisor_nombre   AS nombreEmisor,
                f.tipo_gasto_codigo AS usoCfdi,
                mp.descripcion    AS metodoPago,
                f.subtotal,
                f.iva,
                f.total,
                f.xml_path,
                f.pdf_path,
                f.foto_path
             FROM facturas f
             LEFT JOIN medios_pago mp ON mp.codigo = f.forma_pago_codigo
             WHERE f.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Factura no encontrada" });
        }

        const factura = rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Contenido del XML para la pestaña "XML Source"
        let xml = null;
        try {
            if (factura.xml_path) xml = fs.readFileSync(factura.xml_path, 'utf8');
        } catch (e) {
            console.warn("⚠️ No se pudo leer el archivo XML en disco:", factura.xml_path);
        }

        res.json({
            id: factura.id,
            idTransaccion: factura.idTransaccion,
            fechaCarga: factura.fechaCarga,
            rfcEmisor: factura.rfcEmisor,
            nombreEmisor: factura.nombreEmisor,
            usoCfdi: factura.usoCfdi,
            metodoPago: factura.metodoPago || "—",
            subtotal: factura.subtotal,
            iva: factura.iva,
            total: factura.total,
            moneda: "MXN",
            xml,
            pdfUrl: factura.pdf_path ? `${baseUrl}/${factura.pdf_path}` : null,
            fotoUrl: factura.foto_path ? `${baseUrl}/${factura.foto_path}` : null,
        });
    } catch (error) {
        console.error("❌ Error al obtener detalle de validación:", error);
        res.status(500).json({ error: "Error al obtener el detalle de la factura" });
    }
});

// ---------------------------------------------------------------------------
// POST /api/validaciones/:id/decision   { decision: "deducible" | "no_deducible" }
// Registra la decisión del administrador (mismo efecto que los endpoints
// PUT /facturas/marcar-deducible / marcar-no-deducible que ya tenías)
// ---------------------------------------------------------------------------
router.post('/:id/decision', async (req, res) => {
    const { id } = req.params;
    const { decision } = req.body;

    if (!['deducible', 'no_deducible'].includes(decision)) {
        return res.status(400).json({ error: "Decisión inválida. Usa 'deducible' o 'no_deducible'." });
    }

    const esDeducible = decision === 'deducible';
    const sql = `UPDATE facturas SET deducible = ?, estado = ? WHERE id = ?`;
    const valores = esDeducible
        ? ['SI', 'FACTURADO', id]
        : ['NO', 'NO FACTURADO', id];

    try {
        const [resultado] = await conexionBD.query(sql, valores);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: "Factura no encontrada" });
        }
        res.json({ mensaje: "Decisión registrada correctamente", id, decision });
    } catch (error) {
        console.error("❌ Error al registrar decisión:", error);
        res.status(500).json({ error: "Error al registrar la decisión" });
    }
});

module.exports = router;