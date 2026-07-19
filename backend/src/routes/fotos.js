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
// ============================================================================
// REEMPLAZA en tu routes/fotos.js el endpoint router.post('/subir', ...)
// completo por esta versión. Antes se perdían "monto" y "deduccion_id"
// porque el INSERT no los incluía, aunque el formulario ya los mandaba.
// ============================================================================

router.post('/subir', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió archivo. El campo debe llamarse 'file'." });
    }

    const { usuarioId, descripcion, tipo_gasto_codigo, forma_pago_codigo, monto, deduccion_id } = req.body;
    const rutaArchivo = req.file.path;

    const sql = `INSERT INTO fotos_ticket 
        (usuario_id, descripcion, ruta, tipo_gasto_codigo, forma_pago_codigo, monto, deduccion_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [resultados] = await conexionBD.query(sql, [
            usuarioId,
            descripcion,
            rutaArchivo,
            tipo_gasto_codigo,
            forma_pago_codigo,
            monto || null,
            deduccion_id || null,
        ]);
        return res.json({ mensaje: 'Foto guardada correctamente', ruta: rutaArchivo, id: resultados.insertId });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error al guardar la foto');
    }
});

// ///////////////////////


// GET /api/fotos/historial?usuarioId=&desde=&hasta=&tipoGasto=&estado=&pagina=&porPagina=
// Historial COMPLETO de fotos del usuario (facturadas o no), para la
// pantalla "Mis Fotografías" con su tabla y filtros.
router.get('/historial', async (req, res) => {
    try {
        const { usuarioId, desde, hasta, tipoGasto, estado, pagina = 1, porPagina = 5 } = req.query;

        if (!usuarioId) {
            return res.status(400).json({ error: "Falta usuarioId" });
        }

        let sql = `
            SELECT 
                ft.id,
                ft.ruta,
                ft.fecha,
                ft.descripcion,
                ft.monto        AS montoTicket,
                ft.factura_id,
                ft.subido_manual,
                tg.descripcion  AS tipoGasto,
                df.descripcion  AS deduccionTicket,
                f.emisor_nombre AS razonSocialFactura,
                f.total         AS montoFactura,
                f.deducible     AS deducibleFactura,
                f.estado        AS estadoFactura
            FROM fotos_ticket ft
            LEFT JOIN tipos_gasto tg       ON tg.codigo = ft.tipo_gasto_codigo
            LEFT JOIN deduccion_factura df ON df.id = ft.deduccion_id
            LEFT JOIN facturas f           ON f.id = ft.factura_id
            WHERE ft.usuario_id = ?
        `;
        const params = [usuarioId];

        if (desde) {
            sql += ' AND ft.fecha >= ?';
            params.push(desde);
        }
        if (hasta) {
            sql += ' AND ft.fecha <= ?';
            params.push(hasta);
        }
        if (tipoGasto) {
            sql += ' AND tg.descripcion = ?';
            params.push(tipoGasto);
        }

        // "estado" visible en la tabla = FACTURADO si ya tiene factura_id
        // o si el usuario lo marcó manualmente; si no, NO FACTURADO.
        if (estado === 'FACTURADO') {
            sql += ' AND (ft.factura_id IS NOT NULL OR ft.subido_manual = 1)';
        } else if (estado === 'NO FACTURADO') {
            sql += ' AND ft.factura_id IS NULL AND ft.subido_manual = 0';
        }

        sql += ' ORDER BY ft.fecha DESC';

        const [todas] = await conexionBD.query(sql, params);

        const porPaginaNum = Number(porPagina) || 5;
        const paginaNum = Number(pagina) || 1;
        const inicio = (paginaNum - 1) * porPaginaNum;
        const pagina_datos = todas.slice(inicio, inicio + porPaginaNum);

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const resultado = pagina_datos.map((r) => ({
            id: r.id,
            fotoUrl: `${baseUrl}/${r.ruta}`,
            fecha: r.fecha,
            // Si ya está facturada, mostramos la razón social real de la
            // factura; si no, el "concepto" que el usuario escribió al capturar.
            concepto: r.razonSocialFactura || r.descripcion || "Sin descripción",
            tipoGasto: r.tipoGasto || "—",
            monto: r.montoFactura ?? r.montoTicket ?? null,
            deducible: r.factura_id
                ? (r.deducibleFactura === 'SI' ? 'Sí' : 'No')
                : (r.deduccionTicket ? 'Sí' : 'No'),
            estado: r.factura_id
                ? r.estadoFactura
                : (r.subido_manual ? 'FACTURADO' : 'NO FACTURADO'),
            facturaVinculada: Boolean(r.factura_id), // si es true, el checkbox se bloquea
            subidoManual: Boolean(r.subido_manual),
        }));

        res.json({ fotos: resultado, total: todas.length });
    } catch (error) {
        console.error("❌ Error al obtener historial de fotos:", error);
        res.status(500).json({ error: "Error al obtener el historial de fotos" });
    }
});

// PUT /api/fotos/:id/subido-manual   { subidoManual: true|false }
// Permite al usuario marcar/desmarcar manualmente una foto como "ya facturada",
// para los casos en que facturó por su cuenta sin usar el flujo vinculado.
// Si la foto YA tiene factura_id (vínculo automático real), no se puede tocar.
router.put('/:id/subido-manual', async (req, res) => {
    const { id } = req.params;
    const { subidoManual } = req.body;

    try {
        const [rows] = await conexionBD.query(
            'SELECT factura_id FROM fotos_ticket WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Foto no encontrada" });
        }

        if (rows[0].factura_id) {
            return res.status(400).json({
                error: "Esta foto ya está vinculada automáticamente a una factura y no se puede modificar manualmente.",
            });
        }

        await conexionBD.query(
            'UPDATE fotos_ticket SET subido_manual = ? WHERE id = ?',
            [subidoManual ? 1 : 0, id]
        );

        res.json({ mensaje: "Actualizado correctamente", id, subidoManual: Boolean(subidoManual) });
    } catch (error) {
        console.error("❌ Error al actualizar subido_manual:", error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// ///////////////////

// GET /api/fotos/:id
// Detalle de una foto pendiente, usado por AdminSubirFactura para saber
// de qué usuario es y qué deducción/tipo de gasto ya eligió.
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await conexionBD.query(
            `SELECT
                ft.id,
                ft.usuario_id,
                ft.ruta,
                ft.descripcion,
                ft.monto,
                ft.fecha,
                ft.factura_id,
                tg.descripcion AS tipoGasto,
                df.descripcion AS deduccion,
                CONCAT(u.nombre, ' ', u.apellidoPaterno, IFNULL(CONCAT(' ', u.apellidoMaterno), '')) AS nombreUsuario
             FROM fotos_ticket ft
             LEFT JOIN tipos_gasto tg       ON tg.codigo = ft.tipo_gasto_codigo
             LEFT JOIN deduccion_factura df ON df.id = ft.deduccion_id
             LEFT JOIN usuarios u           ON u.id = ft.usuario_id
             WHERE ft.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Foto no encontrada" });
        }

        const foto = rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.json({
            ...foto,
            fotoUrl: `${baseUrl}/${foto.ruta}`,
        });
    } catch (error) {
        console.error("❌ Error al obtener detalle de foto:", error);
        res.status(500).json({ error: "Error al obtener el detalle de la foto" });
    }
});

module.exports = router;