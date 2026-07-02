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

        const xmlData = fs.readFileSync(xmlFile.path, 'utf8');
        const parsed = await parseStringPromise(xmlData);

        const comprobante = parsed['cfdi:Comprobante']['$'];
        const emisor = parsed['cfdi:Comprobante']['cfdi:Emisor'][0]['$'];
        const receptor = parsed['cfdi:Comprobante']['cfdi:Receptor'][0]['$'];

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
            deducible: 'NO',
            deduccion_id: 1,
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

module.exports = router;