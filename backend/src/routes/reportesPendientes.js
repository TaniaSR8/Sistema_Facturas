const express = require('express');
const router = express.Router();
const conexionBD = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware(['ADMINISTRADOR']));

const diasParaCierreMensual = () => {
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.ceil((ultimoDiaMes - hoy) / msPorDia);
};

// ============================================================================
// GET /api/reportes-pendientes/resumen
// Tarjetas superiores: Monto Total / IVA / Subtotal, Top 3 tipos de gasto,
// y el aviso de cierre próximo.
// ============================================================================
router.get('/resumen', async (req, res) => {
    try {
        const [[{ montoTotal, totalPendientes }]] = await conexionBD.query(
            `SELECT
                COALESCE(SUM(monto), 0) AS montoTotal,
                COUNT(*)                AS totalPendientes
             FROM fotos_ticket
             WHERE factura_id IS NULL AND subido_manual = 0`
        );

        const [topTipos] = await conexionBD.query(
            `SELECT
                tg.descripcion AS tipoGasto,
                SUM(ft.monto)  AS monto
             FROM fotos_ticket ft
             LEFT JOIN tipos_gasto tg ON tg.codigo = ft.tipo_gasto_codigo
             WHERE ft.factura_id IS NULL AND ft.subido_manual = 0
             GROUP BY tg.descripcion
             ORDER BY monto DESC
             LIMIT 3`
        );

        const total = Number(montoTotal || 0);
        const subtotal = total / 1.16;
        const iva = total - subtotal;

        const diasParaCierre = diasParaCierreMensual();

        res.json({
            montoTotal: total,
            subtotal,
            iva,
            totalPendientes,
            topTipos: topTipos.map((t) => ({
                tipoGasto: t.tipoGasto || 'Sin clasificar',
                monto: Number(t.monto || 0),
            })),
            diasParaCierre,
            warning: totalPendientes > 0 && diasParaCierre <= 5, // 👈 NUEVO
        });
    } catch (error) {
        console.error("❌ Error al obtener resumen de pendientes:", error);
        res.status(500).json({ error: "Error al obtener el resumen de pendientes" });
    }
});

// ============================================================================
// GET /api/reportes-pendientes/lista?tipoGasto=&pagina=&porPagina=
// Tabla "Detalle de Facturas Pendientes"
// ============================================================================
router.get('/lista', async (req, res) => {
    try {
        const { tipoGasto, pagina = 1, porPagina = 4 } = req.query;

        let sql = `
            SELECT
                ft.id,
                ft.monto,
                ft.fecha,
                ft.ruta,
                tg.descripcion AS tipoGasto
            FROM fotos_ticket ft
            LEFT JOIN tipos_gasto tg ON tg.codigo = ft.tipo_gasto_codigo
            WHERE ft.factura_id IS NULL AND ft.subido_manual = 0
        `;
        const params = [];

        if (tipoGasto) {
            sql += ' AND tg.descripcion = ?';
            params.push(tipoGasto);
        }

        sql += ' ORDER BY ft.fecha DESC';

        const [todas] = await conexionBD.query(sql, params);

        const porPaginaNum = Number(porPagina) || 4;
        const paginaNum = Number(pagina) || 1;
        const inicio = (paginaNum - 1) * porPaginaNum;
        const pagina_datos = todas.slice(inicio, inicio + porPaginaNum);

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const resultado = pagina_datos.map((r) => ({
            id: `p-${r.id}`,
            monto: r.monto,
            tipoGasto: r.tipoGasto || '—',
            fecha: r.fecha,
            fotoUrl: `${baseUrl}/${r.ruta}`,
            estado: 'PENDIENTE',
        }));

        res.json({ pendientes: resultado, total: todas.length });
    } catch (error) {
        console.error("❌ Error al listar facturas pendientes:", error);
        res.status(500).json({ error: "Error al listar las facturas pendientes" });
    }
});

module.exports = router;