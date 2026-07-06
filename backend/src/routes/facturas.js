const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { parseStringPromise } = require('xml2js');
const conexionBD = require('../config/db'); // pool de mysql2/promise

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Función para insertar factura en BD
async function insertarFactura(factura, res) {
    const sql = `INSERT INTO facturas
                 (fecha, subtotal, iva, total, descripcion, numeroFactura, tipo_gasto_codigo, forma_pago_codigo,
                  emisor_rfc, emisor_nombre, receptor_rfc, receptor_nombre, xml_path, pdf_path, foto_path, usuario_id, uuid,
                  deducible, deduccion_id, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [resultados] = await conexionBD.query(sql, Object.values(factura));
        console.log("✅ Factura insertada:", resultados);
        res.json({ mensaje: 'Factura guardada correctamente', datos: factura });
    } catch (error) {
        console.error("❌ Error en INSERT:", error.sqlMessage || error.message);
        res.status(500).json({ error: "Error al guardar la factura", detalle: error.sqlMessage || error.message });
    }
}

// Endpoint para subir factura (usuario)
router.post('/subir', upload.fields([{ name: 'xml' }, { name: 'pdf' }]), async (req, res) => {
    try {
        const xmlFile = req.files['xml'] ? req.files['xml'][0] : null;
        const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

        if (!xmlFile || !pdfFile) {
            return res.status(400).json({ error: "Debe subir ambos archivos (XML y PDF)" });
        }

        if (!req.body.deduccion_id) {
            return res.status(400).json({ error: "Debes seleccionar una opción de deducción" });
        }

        const xmlData = fs.readFileSync(xmlFile.path, 'utf8');
        const parsed = await parseStringPromise(xmlData);

        console.log(JSON.stringify(parsed, null, 2));

        // 👇 Validación robusta
        const comprobanteNode = parsed['cfdi:Comprobante'] || parsed['Comprobante'];
        if (!comprobanteNode) {
            return res.status(400).json({ error: "El XML no contiene Comprobante válido" });
        }

        const comprobante = comprobanteNode['$'];
        const emisor = comprobanteNode['cfdi:Emisor']?.[0]?.['$'] || comprobanteNode['Emisor']?.[0]?.['$'];
        const receptor = comprobanteNode['cfdi:Receptor']?.[0]?.['$'] || comprobanteNode['Receptor']?.[0]?.['$'];

        const factura = {
            fecha: comprobante.Fecha,
            subtotal: comprobante.SubTotal,
            iva: comprobante.TotalImpuestosTrasladados || 0,
            total: comprobante.Total,
            descripcion: comprobante.Descripcion || null,
            numeroFactura: comprobante.Folio || 'SIN-FOLIO',
            tipo_gasto_codigo: receptor.UsoCFDI,
            forma_pago_codigo: comprobante.FormaPago,
            emisor_rfc: emisor.Rfc,
            emisor_nombre: emisor.Nombre,
            receptor_rfc: receptor.Rfc,
            receptor_nombre: receptor.Nombre,
            xml_path: xmlFile.path,
            pdf_path: pdfFile.path,
            foto_path: null,
            usuario_id: req.body.usuarioId,
            uuid: null,
            deducible: 'NO',                          // el admin decide esto después, en Validaciones
            deduccion_id: req.body.deduccion_id,       // 👈 la elige el usuario al subir
            estado: 'PENDIENTE'
        };

        if (!factura.fecha || !factura.subtotal || !factura.total ||
            !factura.emisor_rfc || !factura.receptor_rfc) {
            return res.status(400).json({ error: "El XML no contiene todos los campos obligatorios" });
        }

        try {
            const timbre = parsed['cfdi:Comprobante']['cfdi:Complemento'][0]['tfd:TimbreFiscalDigital'][0]['$'];
            factura.uuid = timbre.UUID;
        } catch (e) {
            console.warn("⚠️ No se encontró UUID en el XML");
            factura.uuid = 'SIN-UUID-' + Date.now();
        }

        const [rows] = await conexionBD.query('SELECT id FROM facturas WHERE uuid = ?', [factura.uuid]);
        if (rows.length > 0) {
            return res.status(400).json({ error: "Factura duplicada: UUID ya existe" });
        }

        await insertarFactura(factura, res);

    } catch (err) {
        console.error("❌ Error general:", err);
        res.status(500).send('Error al procesar el XML');
    }
});

// Endpoint para marcar factura como deducible (botón del admin)
router.put('/marcar-deducible/:id', async (req, res) => {
    const id = req.params.id;
    const sql = `UPDATE facturas SET deducible = 'SI', estado = 'FACTURADO' WHERE id = ?`;

    try {
        const [resultados] = await conexionBD.query(sql, [id]);
        res.json({ mensaje: 'Factura marcada como deducible', id });
    } catch (error) {
        console.error("❌ Error en UPDATE:", error.sqlMessage || error.message);
        res.status(500).json({ error: "Error al actualizar la factura" });
    }
});

// Endpoint para marcar factura como NO deducible (botón del admin)
router.put('/marcar-no-deducible/:id', async (req, res) => {
    const id = req.params.id;
    const sql = `UPDATE facturas SET deducible = 'NO', estado = 'NO FACTURADO' WHERE id = ?`;

    try {
        const [resultados] = await conexionBD.query(sql, [id]);
        res.json({ mensaje: 'Factura marcada como no deducible', id });
    } catch (error) {
        console.error("❌ Error en UPDATE:", error.sqlMessage || error.message);
        res.status(500).json({ error: "Error al actualizar la factura" });
    }
});

// //////////////////////////////////////

// Endpoint para listar facturas (usado por la pantalla AdminFacturas)
router.get('/listar', async (req, res) => {
    try {
        const { estado, tipoGasto, desde, hasta, pagina = 1, porPagina = 10 } = req.query;

        let sql = `
            SELECT
                f.id,
                f.emisor_nombre  AS razonSocial,
                f.emisor_rfc     AS rfc,
                f.fecha,
                f.subtotal,
                f.iva,
                f.total,
                tg.descripcion   AS tipoGasto,
                f.estado,
                df.descripcion   AS deduccion,
                (f.foto_path IS NOT NULL) AS tieneFoto,
                (f.xml_path  IS NOT NULL) AS tieneXml,
                (f.pdf_path  IS NOT NULL) AS tienePdf,
                CONCAT(u.nombre, ' ', u.apellidoPaterno, IFNULL(CONCAT(' ', u.apellidoMaterno), '')) AS nombreUsuario
            FROM facturas f
                     LEFT JOIN tipos_gasto tg       ON tg.codigo = f.tipo_gasto_codigo
                     LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
                     LEFT JOIN usuarios u            ON u.id = f.usuario_id
            WHERE 1 = 1
        `;
        const params = [];

        if (estado) {
            sql += ' AND f.estado = ?';
            params.push(estado);
        }
        if (tipoGasto) {
            sql += ' AND tg.descripcion = ?';
            params.push(tipoGasto);
        }
        if (desde) {
            sql += ' AND f.fecha >= ?';
            params.push(desde);
        }
        if (hasta) {
            sql += ' AND f.fecha <= ?';
            params.push(hasta);
        }

        sql += ' ORDER BY f.fecha DESC';

        const [todas] = await conexionBD.query(sql, params);

        // Paginación en memoria (para un catálogo grande, mejor hacerla con
        // LIMIT/OFFSET directo en el SQL, pero esto ya deja todo funcional)
        const porPaginaNum = Number(porPagina) || 10;
        const paginaNum = Number(pagina) || 1;
        const inicio = (paginaNum - 1) * porPaginaNum;
        const facturasPagina = todas.slice(inicio, inicio + porPaginaNum);

        res.json({ facturas: facturasPagina, total: todas.length });
    } catch (error) {
        console.error("❌ Error al listar facturas:", error);
        res.status(500).json({ error: "Error al listar facturas" });
    }
});

// Endpoint para obtener el catálogo real de tipos de gasto
// (para que el filtro del frontend deje de usar valores inventados)
router.get('/catalogos/tipos-gasto', async (req, res) => {
    try {
        const [rows] = await conexionBD.query(
            'SELECT codigo, descripcion FROM tipos_gasto ORDER BY descripcion'
        );
        res.json(rows);
    } catch (error) {
        console.error("❌ Error al obtener tipos de gasto:", error);
        res.status(500).json({ error: "Error al obtener catálogo" });
    }
});

// Nuevo endpoint para catálogo de deducciones
router.get('/catalogos/deducciones', async (req, res) => {
    try {
        const [rows] = await conexionBD.query(
            'SELECT id, descripcion FROM deduccion_factura ORDER BY descripcion'
        );
        res.json(rows);
    } catch (error) {
        console.error("❌ Error al obtener deducciones:", error);
        res.status(500).json({ error: "Error al obtener catálogo de deducciones" });
    }
});

// /////////////////

// ============================================================================
// AGREGAR ESTE BLOQUE a tu routes/facturas.js existente,
// justo antes de "module.exports = router;"
// (No reemplaza /listar, que es el de AdminFacturas; este es aparte,
// filtrado siempre por el usuario logueado)
// ============================================================================

// GET /api/facturas/dashboard?usuarioId=&buscar=&pagina=&porPagina=
// Resumen + tabla de facturas del USUARIO logueado (no de todos, como /listar)
router.get('/dashboard', async (req, res) => {
    try {
        const { usuarioId, buscar, pagina = 1, porPagina = 10 } = req.query;

        if (!usuarioId) {
            return res.status(400).json({ error: "Falta usuarioId" });
        }

        // ---------- Resumen (tarjetas de arriba) ----------
        const [[{ pendientesFotos }]] = await conexionBD.query(
            `SELECT COUNT(*) AS pendientesFotos
             FROM fotos_ticket
             WHERE usuario_id = ? AND factura_id IS NULL AND subido_manual = 0`,
            [usuarioId]
        );

        const [[{ validadas }]] = await conexionBD.query(
            `SELECT COUNT(*) AS validadas FROM facturas WHERE usuario_id = ? AND estado = 'FACTURADO'`,
            [usuarioId]
        );

        const [[{ rechazadas }]] = await conexionBD.query(
            `SELECT COUNT(*) AS rechazadas FROM facturas WHERE usuario_id = ? AND estado = 'NO FACTURADO'`,
            [usuarioId]
        );

        // ---------- Tabla de facturas del usuario ----------
        let sql = `
            SELECT 
                f.id,
                f.numeroFactura,
                f.emisor_rfc     AS rfc,
                f.emisor_nombre  AS razonSocial,
                f.fecha,
                tg.descripcion   AS tipoGasto,
                f.estado
            FROM facturas f
            LEFT JOIN tipos_gasto tg ON tg.codigo = f.tipo_gasto_codigo
            WHERE f.usuario_id = ?
        `;
        const params = [usuarioId];

        if (buscar) {
            sql += ` AND (f.numeroFactura LIKE ? OR f.emisor_nombre LIKE ? OR f.emisor_rfc LIKE ?)`;
            const termino = `%${buscar}%`;
            params.push(termino, termino, termino);
        }

        sql += ' ORDER BY f.fecha DESC';

        const [todas] = await conexionBD.query(sql, params);

        const porPaginaNum = Number(porPagina) || 10;
        const paginaNum = Number(pagina) || 1;
        const inicio = (paginaNum - 1) * porPaginaNum;
        const facturasPagina = todas.slice(inicio, inicio + porPaginaNum);

        res.json({
            resumen: {
                pendientesFotos,
                facturasValidadas: validadas,
                facturasRechazadas: rechazadas,
            },
            facturas: facturasPagina,
            total: todas.length,
        });
    } catch (error) {
        console.error("❌ Error al obtener dashboard de facturas:", error);
        res.status(500).json({ error: "Error al obtener el dashboard" });
    }
});

module.exports = router;