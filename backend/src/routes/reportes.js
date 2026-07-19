const express = require('express');
const router = express.Router();
const conexionBD = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

// ---------------------------------------------------------------------------
// Seguridad: solo  ADMINISTRADOR pueden acceder a /api/reportes/*
// Se aplica a TODAS las rutas de este router.
// ---------------------------------------------------------------------------
router.use(authMiddleware(['ADMINISTRADOR']));

// Determina si una deducción implica que la factura fue emitida a nombre
// de la PERSONA (empleado) en vez de a Blupster. Se basa en el texto de
// deduccion_factura.descripcion que ya usa el sistema.
// Si mañana cambias el texto de esa opción en la BD, solo ajustas aquí.
const esFacturadoAPersona = (descripcionDeduccion) => {
    if (!descripcionDeduccion) return false;
    return descripcionDeduccion.toLowerCase().includes('facturó a usuario');
};

// Calcula cuántos días faltan para el cierre mensual (último día del mes actual)
const diasParaCierreMensual = () => {
    const hoy = new Date();
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.ceil((ultimoDiaMes - hoy) / msPorDia);
};

// ---------------------------------------------------------------------------
// GET /api/reportes/usuarios
// Lista de usuarios con sus totales (Blupster / Persona), para la pantalla
// general de "Reporte por Usuario". Al hacer clic en uno, se abre su detalle.
// ---------------------------------------------------------------------------
router.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await conexionBD.query(`
            SELECT
                u.id,
                CONCAT(u.nombre, ' ', u.apellidoPaterno, IFNULL(CONCAT(' ', u.apellidoMaterno), '')) AS nombre,
                u.correo,
                f.id AS facturaId,
                f.total,
                df.descripcion AS deduccionDescripcion
            FROM usuarios u
            LEFT JOIN facturas f ON f.usuario_id = u.id
            LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
            WHERE u.rol = 'USUARIO'
            ORDER BY u.nombre
        `);

        const dias = diasParaCierreMensual();

        // Agrupamos manualmente por usuario (más simple y legible que un
        // GROUP BY con CASE anidados, y evita duplicar la lógica de clasificación).
        const usuariosMap = new Map();

        for (const row of rows) {
            if (!usuariosMap.has(row.id)) {
                usuariosMap.set(row.id, {
                    id: row.id,
                    nombre: row.nombre,
                    correo: row.correo,
                    totalBlupster: 0,
                    totalPersona: 0,
                });
            }
            const usuario = usuariosMap.get(row.id);
            if (row.facturaId) {
                if (esFacturadoAPersona(row.deduccionDescripcion)) {
                    usuario.totalPersona += Number(row.total);
                } else {
                    usuario.totalBlupster += Number(row.total);
                }
            }
        }

        const usuarios = [...usuariosMap.values()].map((u) => ({
            ...u,
            warning: u.totalPersona > 0 && dias <= 5,
        }));

        res.json(usuarios);
    } catch (error) {
        console.error("❌ Error al listar reporte por usuario:", error);
        res.status(500).json({ error: "Error al listar el reporte por usuario" });
    }
});

// ---------------------------------------------------------------------------
// GET /api/reportes/usuario/:id
// Detalle del reporte de UN usuario: facturas separadas en Blupster / Persona,
// totales de cada grupo, campo facturadoA por factura y el aviso de cierre.
// ---------------------------------------------------------------------------
router.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [usuarioRows] = await conexionBD.query(
            `SELECT id,
                    CONCAT(nombre, ' ', apellidoPaterno, IFNULL(CONCAT(' ', apellidoMaterno), '')) AS nombre,
                    correo
             FROM usuarios WHERE id = ?`,
            [id]
        );

        if (usuarioRows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuario = usuarioRows[0];

        const [facturas] = await conexionBD.query(
            `SELECT
                 f.id,
                 COALESCE(f.descripcion, f.emisor_nombre) AS concepto,
                 tg.descripcion AS tipoGasto,
                 f.fecha,
                 f.subtotal,
                 f.iva,
                 f.total,
                 f.estado,
                 df.descripcion AS deduccionDescripcion
             FROM facturas f
             LEFT JOIN tipos_gasto tg ON tg.codigo = f.tipo_gasto_codigo
             LEFT JOIN deduccion_factura df ON df.id = f.deduccion_id
             WHERE f.usuario_id = ?
             ORDER BY f.fecha DESC`,
            [id]
        );

        const facturasBlupster = [];
        const facturasPersona = [];
        let totalBlupster = 0;
        let totalPersona = 0;

        for (const f of facturas) {
            // 👇 campo facturadoA: lo usa el frontend para el badge/check visual
            const facturadoA = esFacturadoAPersona(f.deduccionDescripcion) ? 'PERSONA' : 'BLUPSTER';
            const filaFormateada = {
                id: f.id,
                concepto: f.concepto,
                tipoGasto: f.tipoGasto || "—",
                fecha: f.fecha,
                subtotal: f.subtotal,
                iva: f.iva,
                total: f.total,
                estado: f.estado,
                facturadoA,
            };

            if (facturadoA === 'PERSONA') {
                facturasPersona.push(filaFormateada);
                totalPersona += Number(f.total);
            } else {
                facturasBlupster.push(filaFormateada);
                totalBlupster += Number(f.total);
            }
        }

        const dias = diasParaCierreMensual();
        const warning = totalPersona > 0 && dias <= 5;

        res.json({
            usuario,
            facturasBlupster,
            facturasPersona,
            totalBlupster,
            totalPersona,
            diasParaCierre: dias,
            warning,
        });
    } catch (error) {
        console.error("❌ Error al obtener reporte de usuario:", error);
        res.status(500).json({ error: "Error al obtener el reporte del usuario" });
    }
});

// ---------------------------------------------------------------------------
// POST /api/reportes/usuario/:id/solicitar-recibo
// Se mantiene simple, sin tabla ni historial: solo confirma con éxito.
// ---------------------------------------------------------------------------
router.post('/usuario/:id/solicitar-recibo', async (req, res) => {
    const { id } = req.params;
    console.log(`📩 Solicitud de emisión de recibo para usuario ${id} registrada.`);
    res.json({ mensaje: "Solicitud registrada correctamente" });
});

module.exports = router;