const jwt = require("jsonwebtoken");

const authMiddleware = (rolesPermitidos = []) => {
    return (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.status(401).json({ message: "Token requerido" });

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Token inválido" });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = decoded;

            if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(decoded.rol)) {
                return res.status(403).json({ message: "Acceso denegado" });
            }

            next();
        } catch (error) {
            res.status(403).json({ message: "Token inválido o expirado" });
        }
    };
};

module.exports = authMiddleware;
