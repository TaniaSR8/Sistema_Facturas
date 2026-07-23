const express = require('express');
const router = express.Router();
const conexionBD = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware(['ADMINISTRADOR']));

const esFacturadoAPersona = (descripcionDeduccion) => {
    if (!descripcionDeduccion) return false;
    return descripcionDeduccion.toLowerCase().includes('facturó a usuario');
};

// Agregar junto a esFacturadoAPersona y etiquetaEstado
const diasParaCierreMensual = () => {
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.ceil((ultimoDiaMes - hoy) / msPorDia);
};


const etiquetaEstado = (estado) => {
    if (estado === 'FACTURADO') return 'VIGENTE';
    if (estado === 'PENDIENTE') return 'PENDIENTE';
    return 'NO FACTURADO';
};

// ============================================================================
// GET /api/reportes-globales/diot?rfc=&tipoGasto=&estado=
// Agrupa facturas por RFC del emisor, separando "Empresa" (facturado a
// Blupster) vs "Usuario" (facturado a la persona empleada).
// ============================================================================
router.get('/diot', async (req, res) => {
    try {
        const { rfc, tipoGasto, estado } = req.query;

        let sql = `
            SELECT
                f.emisor_rfc,
                f.emisor_nombre,
                f.iva,
                f.total,
                f.estado,
                tg.descripcion AS tipoGasto,
                df.descripcion AS deduccionDescripcion
            FROM facturas f
                     LEFT JOIN tipos_gasto tg ON tg.codigo = f.tipo_gasto_codigo
                     LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
            WHERE 1 = 1
        `;
        const params = [];

        if (rfc) {
            sql += ' AND (f.emisor_rfc LIKE ? OR f.receptor_rfc LIKE ?)';
            params.push(`%${rfc}%`, `%${rfc}%`);
        }
        if (tipoGasto) {
            sql += ' AND tg.descripcion = ?';
            params.push(tipoGasto);
        }
        if (estado) {
            sql += ' AND f.estado = ?';
            params.push(estado);
        }

        sql += ' ORDER BY f.emisor_rfc';

        const [rows] = await conexionBD.query(sql, params);

        // Agrupamos por RFC del emisor, y dentro de cada RFC por
        // "Empresa" / "Usuario" según a quién se facturó.
        const grupos = new Map();

        for (const f of rows) {
            if (!grupos.has(f.emisor_rfc)) {
                grupos.set(f.emisor_rfc, {
                    rfc: f.emisor_rfc,
                    razonSocial: f.emisor_nombre,
                    empresa: { facturas: 0, iva: 0, total: 0, tipos: new Set(), estados: new Set() },
                    usuario: { facturas: 0, iva: 0, total: 0, tipos: new Set(), estados: new Set() },
                });
            }
            const grupo = grupos.get(f.emisor_rfc);
            const destino = esFacturadoAPersona(f.deduccionDescripcion) ? 'usuario' : 'empresa';
            grupo[destino].facturas += 1;
            grupo[destino].iva += Number(f.iva || 0);
            grupo[destino].total += Number(f.total);
            grupo[destino].tipos.add(f.tipoGasto || 'Sin clasificar');
            grupo[destino].estados.add(etiquetaEstado(f.estado));
        }

        const resumirSubgrupo = (sub) => {
            if (sub.facturas === 0) return null;
            const tipos = [...sub.tipos];
            const estados = [...sub.estados];
            return {
                facturas: sub.facturas,
                iva: sub.iva,
                total: sub.total,
                tipoGasto: tipos.length === 1 ? tipos[0] : 'VARIOS',
                estado: estados.length === 1 ? estados[0] : 'PENDIENTE',
            };
        };

        const resultado = [...grupos.values()].map((g) => ({
            rfc: g.rfc,
            razonSocial: g.razonSocial,
            empresa: resumirSubgrupo(g.empresa),
            usuario: resumirSubgrupo(g.usuario),
            totalGrupo: g.empresa.total + g.usuario.total,
        }));

        const granTotal = resultado.reduce((acc, g) => acc + g.totalGrupo, 0);

        res.json({ grupos: resultado, granTotal });
    } catch (error) {
        console.error("❌ Error al generar reporte DIOT:", error);
        res.status(500).json({ error: "Error al generar el reporte DIOT" });
    }
});

// ============================================================================
// GET /api/reportes-globales/pendientes?usuarioId=&tipoGasto=&estado=
// Facturas/fotos que requieren acción: solicitar factura (falta XML/PDF)
// o emitir recibo (facturado a la persona).
// ============================================================================
router.get('/pendientes', async (req, res) => {
    try {
        const { usuarioId, tipoGasto, estado } = req.query;

        let sql = `
            SELECT * FROM (
                SELECT
                    CONCAT('f-', f.id)                AS id,
                    f.usuario_id,
                    CONCAT(u.nombre, ' ', u.apellidoPaterno, IFNULL(CONCAT(' ', u.apellidoMaterno), '')) AS usuario,
                    COALESCE(f.descripcion, f.emisor_nombre)                                  AS concepto,
                    tg.descripcion                    AS tipoGasto,
                    f.fecha,
                    f.total                            AS monto,
                    f.estado,
                    df.descripcion                     AS deduccionDescripcion,
                    0                                   AS requiereFactura
                FROM facturas f
                LEFT JOIN tipos_gasto tg       ON tg.codigo = f.tipo_gasto_codigo
                LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
                LEFT JOIN usuarios u            ON u.id = f.usuario_id

                UNION ALL

                SELECT
                    CONCAT('p-', ft.id)               AS id,
                    ft.usuario_id,
                    CONCAT(u.nombre, ' ', u.apellidoPaterno, IFNULL(CONCAT(' ', u.apellidoMaterno), '')) AS usuario,
                    COALESCE(ft.descripcion, 'Comprobante sin factura')                        AS concepto,
                    tg.descripcion                     AS tipoGasto,
                    ft.fecha,
                    ft.monto,
                    'PENDIENTE'                         AS estado,
                    df.descripcion                      AS deduccionDescripcion,
                    1                                    AS requiereFactura
                FROM fotos_ticket ft
                LEFT JOIN tipos_gasto tg       ON tg.codigo = ft.tipo_gasto_codigo
                LEFT JOIN deduccion_factura df ON df.id = ft.deduccion_id
                LEFT JOIN usuarios u            ON u.id = ft.usuario_id
                WHERE ft.factura_id IS NULL AND ft.subido_manual = 0
            ) combinado
            WHERE 1 = 1
        `;
        const params = [];

        if (usuarioId) {
            sql += ' AND usuario_id = ?';
            params.push(usuarioId);
        }
        if (tipoGasto) {
            sql += ' AND tipoGasto = ?';
            params.push(tipoGasto);
        }
        if (estado) {
            sql += ' AND estado = ?';
            params.push(estado);
        }

        sql += ' ORDER BY fecha DESC';

        const [rows] = await conexionBD.query(sql, params);

        const resultado = rows.map((r) => ({
            id: r.id,
            usuario: r.usuario || '—',
            concepto: r.concepto,
            tipoGasto: r.tipoGasto || '—',
            fecha: r.fecha,
            monto: r.monto,
            estado: r.estado,
            requiereFactura: Boolean(r.requiereFactura),
            requiereRecibo: esFacturadoAPersona(r.deduccionDescripcion),
        }));

        // 👇 NUEVO — aviso si hay algo pendiente de recibo/factura y quedan 5 días o menos
        const hayPendientesUrgentes = resultado.some((r) => r.requiereFactura || r.requiereRecibo);
        const warning = hayPendientesUrgentes && diasParaCierreMensual() <= 5;

        res.json({ pendientes: resultado, total: resultado.length, warning, diasParaCierre: diasParaCierreMensual() });
    } catch (error) {
        console.error("❌ Error al listar pendientes:", error);
        res.status(500).json({ error: "Error al listar facturas/recibos pendientes" });
    }
});

// ============================================================================
// POST /api/reportes-globales/solicitar-factura/:id
// POST /api/reportes-globales/emitir-recibo/:id
// Simples, sin tabla de historial (igual que /reportes/usuario/:id/solicitar-recibo)
// ============================================================================
router.post('/solicitar-factura/:id', async (req, res) => {
    console.log(`📩 Solicitud de factura registrada para el comprobante ${req.params.id}.`);
    res.json({ mensaje: "Solicitud de factura registrada correctamente" });
});

router.post('/emitir-recibo/:id', async (req, res) => {
    console.log(`🧾 Solicitud de emisión de recibo registrada para ${req.params.id}.`);
    res.json({ mensaje: "Solicitud de recibo registrada correctamente" });
});

module.exports = router;