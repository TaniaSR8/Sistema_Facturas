// backend/controllers/gastosController.js
const db = require('../config/db'); // conexión MySQL

// Obtener presupuesto global y usuarios activos (solo rol USUARIO)
exports.obtenerPresupuesto = async (req, res) => {
    try {
        // Obtener el último límite global configurado
        const [global] = await db.query(
            "SELECT monto_maximo FROM presupuesto_global ORDER BY id DESC LIMIT 1"
        );

        // Obtener usuarios activos con rol USUARIO y su monto asignado
        // Obtener usuarios activos con rol USUARIO y su monto asignado
        const [usuarios] = await db.query(`
            SELECT u.id, u.numeroEmpleado, u.nombre, u.apellidoPaterno, u.apellidoMaterno,
                   u.rfc, u.correo, u.rol, u.estado,
                   COALESCE(pu.monto_permitido, 0) AS limiteGasto
            FROM usuarios u
                     LEFT JOIN presupuesto_usuario pu ON u.id = pu.usuario_id
            WHERE u.estado = 'ACTIVO' AND u.rol = 'USUARIO'
        `);


        res.json({
            limiteEmpresarial: global.length ? global[0].monto_maximo : 0,
            empleados: usuarios
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener presupuesto" });
    }
};

// Actualizar presupuesto global y usuarios (solo rol USUARIO activo)
exports.actualizarPresupuesto = async (req, res) => {
    const { limiteEmpresarial, empleados } = req.body;

    // Validaciones
    if (!limiteEmpresarial || limiteEmpresarial <= 0) {
        return res.status(400).json({ error: "El límite empresarial debe ser mayor a 0" });
    }

    const totalAsignado = empleados.reduce((sum, emp) => sum + (emp.limiteGasto || 0), 0);
    if (totalAsignado > limiteEmpresarial) {
        return res.status(400).json({ error: "El total asignado excede el límite empresarial" });
    }

    try {
        // Guardar nuevo límite global
        await db.query("INSERT INTO presupuesto_global (monto_maximo) VALUES (?)", [limiteEmpresarial]);

        // Guardar montos por usuario (solo USUARIO activo)
        for (const emp of empleados) {
            if (emp.rol !== 'USUARIO' || emp.estado !== 'ACTIVO') continue;

            if (emp.limiteGasto < 0) {
                return res.status(400).json({ error: `Monto inválido para usuario ${emp.id}` });
            }

            await db.query(`
                INSERT INTO presupuesto_usuario (usuario_id, monto_permitido)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE monto_permitido = VALUES(monto_permitido)
            `, [emp.id, emp.limiteGasto]);
        }

        res.json({ mensaje: "Presupuesto actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar presupuesto" });
    }
};
