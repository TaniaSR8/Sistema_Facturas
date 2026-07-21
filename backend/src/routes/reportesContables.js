const express = require('express');
const router = express.Router();
const conexionBD = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware(['ADMINISTRADOR']));

// ============================================================================
// GET /api/reportes/contabilidad-general?desde=&hasta=
// Devuelve el resumen (ingresos / egresos / resultado) y el detalle fila por
// fila, usando la vista vw_contabilidad_general.
// ============================================================================
router.get('/contabilidad-general', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        let condicionFecha = '';
        const params = [];

        if (desde) {
            condicionFecha += ' AND fecha >= ?';
            params.push(desde);
        }
        if (hasta) {
            condicionFecha += ' AND fecha <= ?';
            params.push(hasta);
        }

        // ---------- Resumen: Ingresos ----------
        const [[ingresosRow]] = await conexionBD.query(
            `SELECT
                 COALESCE(SUM(subtotal), 0) AS subtotal,
                 COALESCE(SUM(iva), 0)      AS iva,
                 COALESCE(SUM(total), 0)    AS total
             FROM vw_contabilidad_general
             WHERE tipo = 'Ingreso' ${condicionFecha}`,
            params
        );

        // ---------- Resumen: Egresos - Empresa (facturas a Blupster) ----------
        const [[egresosEmpresaRow]] = await conexionBD.query(
            `SELECT
                 COALESCE(SUM(subtotal), 0) AS subtotal,
                 COALESCE(SUM(iva), 0)      AS iva,
                 COALESCE(SUM(total), 0)    AS total
             FROM vw_contabilidad_general
             WHERE tipo = 'Egreso-Empresa' ${condicionFecha}`,
            params
        );

        // ---------- Resumen: Egresos - Reembolsos a empleados ----------
        const [[egresosEmpleadosRow]] = await conexionBD.query(
            `SELECT
                 COALESCE(SUM(subtotal), 0) AS subtotal,
                 COALESCE(SUM(iva), 0)      AS iva,
                 COALESCE(SUM(total), 0)    AS total
             FROM vw_contabilidad_general
             WHERE tipo = 'Egreso-Reembolso' ${condicionFecha}`,
            params
        );

        // ---------- Detalle fila por fila (para tabla y exportaciones) ----------
        const [detalle] = await conexionBD.query(
            `SELECT id, fecha, rfc, razonSocial, subtotal, iva, total, tipo
             FROM vw_contabilidad_general
             WHERE 1 = 1 ${condicionFecha}
             ORDER BY fecha DESC`,
            params
        );

        const totalIngresos = Number(ingresosRow.total);
        const totalEgresos = Number(egresosEmpresaRow.total) + Number(egresosEmpleadosRow.total);

        res.json({
            ingresos: {
                subtotal: Number(ingresosRow.subtotal),
                iva: Number(ingresosRow.iva),
                total: totalIngresos,
            },
            egresos: {
                empresa: {
                    subtotal: Number(egresosEmpresaRow.subtotal),
                    iva: Number(egresosEmpresaRow.iva),
                    total: Number(egresosEmpresaRow.total),
                },
                empleados: {
                    subtotal: Number(egresosEmpleadosRow.subtotal),
                    iva: Number(egresosEmpleadosRow.iva),
                    total: Number(egresosEmpleadosRow.total),
                },
                total: totalEgresos,
            },
            resultado: totalIngresos - totalEgresos,
            detalle,
        });
    } catch (error) {
        console.error("❌ Error al generar el reporte contable general:", error);
        res.status(500).json({ error: "Error al generar el reporte contable general" });
    }
});

module.exports = router;