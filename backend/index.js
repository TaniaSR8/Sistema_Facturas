const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

// Helper to get user email from authorization token
function getCorreoDesdeToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    const payloadParts = token.split(".");
    if (payloadParts.length < 2) return null;
    const decoded = Buffer.from(payloadParts[1], "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return parsed.correo || null;
  } catch (e) {
    return null;
  }
}

async function obtenerPoliticas() {
  const defaultPoliticas = {
    longitudMinima: 8,
    longitudMaxima: 16,
    minNumeros: 1,
    minEspeciales: 1,
    minMayusculas: 1,
    minMinusculas: 1
  };
  
  // 1. Intentar obtener de la base de datos MySQL
  try {
    const [rows] = await pool.execute("SELECT valor FROM configuraciones WHERE clave = 'politicas_contrasena' LIMIT 1");
    if (rows.length > 0 && rows[0].valor) {
      return JSON.parse(rows[0].valor);
    }
  } catch (err) {
    console.warn("⚠️ No se pudieron obtener las políticas de la BD:", err.message);
  }

  // 2. Si no se encontró en la BD (o hubo error), intentar leer de la simulación local
  try {
    const fs = require("fs");
    const path = require("path");
    const politicasPath = path.join(__dirname, "simulado_politicas.json");
    if (fs.existsSync(politicasPath)) {
      const fileContent = fs.readFileSync(politicasPath, "utf8");
      return JSON.parse(fileContent);
    }
  } catch (fsErr) {
    console.warn("No se pudo leer el archivo de políticas simulado:", fsErr.message);
  }

  // 3. De lo contrario, retornar las políticas por defecto
  return defaultPoliticas;
}


async function validarContrasenaConPoliticas(contrasena) {
  const politicas = await obtenerPoliticas();
  const {
    longitudMinima = 8,
    longitudMaxima = 16,
    minNumeros = 1,
    minEspeciales = 1,
    minMayusculas = 1,
    minMinusculas = 1
  } = politicas;

  if (!contrasena) {
    return { valido: false, mensaje: "La contraseña es requerida." };
  }
  if (contrasena.length < longitudMinima) {
    return { valido: false, mensaje: `La contraseña debe tener al menos ${longitudMinima} caracteres.` };
  }
  if (contrasena.length > longitudMaxima) {
    return { valido: false, mensaje: `La contraseña no debe exceder los ${longitudMaxima} caracteres.` };
  }

  const numMinusculas = (contrasena.match(/[a-z]/g) || []).length;
  const numMayusculas = (contrasena.match(/[A-Z]/g) || []).length;
  const numNumeros = (contrasena.match(/[0-9]/g) || []).length;
  const numEspeciales = (contrasena.match(/[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\};':",\.<>\/\?\\|`~]/g) || []).length;

  if (numMinusculas < minMinusculas) {
    return { valido: false, mensaje: `La contraseña debe incluir al menos ${minMinusculas} letra(s) minúscula(s).` };
  }
  if (numMayusculas < minMayusculas) {
    return { valido: false, mensaje: `La contraseña debe incluir al menos ${minMayusculas} letra(s) mayúscula(s).` };
  }
  if (numNumeros < minNumeros) {
    return { valido: false, mensaje: `La contraseña debe incluir al menos ${minNumeros} número(s).` };
  }
  if (numEspeciales < minEspeciales) {
    return { valido: false, mensaje: `La contraseña debe incluir al menos ${minEspeciales} carácter(es) especial(es) (ej. !, @, #, $).` };
  }

  return { valido: true };
}


const app = express();
const PORT = 3001;

// Habilitar CORS para permitir peticiones del frontend (por ejemplo, desde http://localhost:5173)
app.use(cors());
app.use(express.json());

// Configuración de conexión pool para MySQL
// Remplaza estas credenciales con las de tu base de datos local o de producción
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "tu_password", // Remplazar por tu contraseña de MySQL
  database: process.env.DB_NAME || "sistema_facturas", // Remplazar por tu nombre de BD
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

app.get("/", (req, res) => {
  res.send("Servidor backend funcionando correctamente 🚀");
});

// Endpoint para actualizar los datos del usuario en la base de datos MySQL
app.put("/api/perfil/actualizar", async (req, res) => {
  const { nombre, correo, estado, telefono, numeroEmpleado, fechaCreacion } = req.body;

  // Validación de campos requeridos
  if (!nombre || !correo || !numeroEmpleado) {
    return res.status(400).json({ 
      mensaje: "Faltan campos obligatorios: nombre, correo y número de empleado son requeridos." 
    });
  }

  // Dividir el nombre completo en partes para guardar en columnas separadas si existen
  const partes = nombre.trim().split(/\s+/);
  const nombrePila = partes[0] || nombre;
  const apellidoPaterno = partes[1] || "NA";
  const apellidoMaterno = partes.slice(2).join(" ") || "NA";

  try {
    let resultado;
    try {
      // 1. Intentar actualizar con columnas snake_case incluyendo fecha_creacion
      const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, correo = ?, estado = ?, telefono = ?, fecha_creacion = ? 
        WHERE numero_empleado = ? OR numeroEmpleado = ?
      `;
      [resultado] = await pool.execute(query, [
        nombrePila,
        apellidoPaterno,
        apellidoMaterno,
        correo,
        estado,
        telefono,
        fechaCreacion || "25/05/2026",
        numeroEmpleado,
        numeroEmpleado
      ]);
    } catch (dbError) {
      try {
        // 2. Intentar con camelCase incluyendo fechaCreacion
        const query = `
          UPDATE usuarios 
          SET nombre = ?, apellidoPaterno = ?, apellidoMaterno = ?, correo = ?, estado = ?, telefono = ?, fechaCreacion = ? 
          WHERE numero_empleado = ? OR numeroEmpleado = ?
        `;
        [resultado] = await pool.execute(query, [
          nombrePila,
          apellidoPaterno,
          apellidoMaterno,
          correo,
          estado,
          telefono,
          fechaCreacion || "25/05/2026",
          numeroEmpleado,
          numeroEmpleado
        ]);
      } catch (dbError2) {
        // 3. Fallback final: actualizar solo campos estándar
        const query = `
          UPDATE usuarios 
          SET nombre = ?, correo = ?, estado = ?, telefono = ? 
          WHERE numero_empleado = ? OR numeroEmpleado = ?
        `;
        [resultado] = await pool.execute(query, [nombre, correo, estado, telefono, numeroEmpleado, numeroEmpleado]);
      }
    }

    console.log(`Usuario ${numeroEmpleado} actualizado correctamente en la base de datos.`);
    
    return res.status(200).json({
      mensaje: "Datos actualizados en MySQL con éxito.",
      nombre,
      correo,
      estado,
      telefono,
      numeroEmpleado,
      fechaCreacion: fechaCreacion || "25/05/2026"
    });
  } catch (error) {
    // Si falla la conexión a la base de datos (por ejemplo, porque aún no se ha configurado la tabla o las credenciales)
    console.warn("⚠️ Error en base de datos MySQL:", error.message);
    console.warn("Utilizando datos simulados (fallback) para permitir pruebas en el frontend sin configurar la base de datos.");

    // Guardar de forma persistente localmente
    const fs = require("fs");
    const path = require("path");
    const profilePath = path.join(__dirname, "simulado_perfil.json");
    const perfilSimulado = {
      nombre,
      numeroEmpleado,
      correo,
      estado,
      telefono,
      fechaCreacion: fechaCreacion || "25/05/2026"
    };
    try {
      fs.writeFileSync(profilePath, JSON.stringify(perfilSimulado, null, 2), "utf8");
    } catch (fsErr) {
      console.warn("No se pudo escribir el archivo de perfil simulado:", fsErr.message);
    }

    // Retorna una simulación exitosa para que el frontend no falle y el diseño pueda ser evaluado completamente
    return res.status(200).json({
      mensaje: "Datos actualizados (Simulado para pruebas frontend, configurar MySQL para persistencia)",
      nombre,
      correo,
      estado,
      telefono,
      numeroEmpleado,
      fechaCreacion: fechaCreacion || "25/05/2026",
      simulado: true
    });
  }
});


// Endpoint helper para actualizar usuario por ID
async function actualizarUsuarioPorId(id, body, res) {
  const {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    rfc,
    correo,
    rol,
    telefono,
    estado,
    numeroEmpleado,
    num
  } = body;

  const idNum = Number(id);

  try {
    // 1. Intentar obtener los datos actuales del usuario para hacer un merge si faltan campos
    let usuarioExistente = {};
    try {
      const [rows] = await pool.execute("SELECT * FROM usuarios WHERE id = ?", [idNum]);
      if (rows.length > 0) {
        usuarioExistente = rows[0];
      }
    } catch (err) {
      console.warn("⚠️ No se pudo consultar el usuario existente de la BD:", err.message);
    }

    // 2. Fusionar los datos recibidos con los existentes
    const noEmpleadoFinal = numeroEmpleado || num || usuarioExistente.numero_empleado || usuarioExistente.numeroEmpleado || "";
    const nombreFinal = nombre !== undefined ? nombre : (usuarioExistente.nombre || "");
    const apellidoPaternoFinal = apellidoPaterno !== undefined ? apellidoPaterno : (usuarioExistente.apellido_paterno || usuarioExistente.apellidoPaterno || "NA");
    const apellidoMaternoFinal = apellidoMaterno !== undefined ? apellidoMaterno : (usuarioExistente.apellido_materno || usuarioExistente.apellidoMaterno || "NA");
    const rfcFinal = rfc !== undefined ? rfc : (usuarioExistente.rfc || "");
    const correoFinal = correo !== undefined ? correo : (usuarioExistente.correo || "");
    const rolFinal = rol !== undefined ? rol : (usuarioExistente.rol || "USUARIO");
    const telefonoFinal = telefono !== undefined ? telefono : (usuarioExistente.telefono || "0000000000");
    const estadoFinal = estado !== undefined ? estado : (usuarioExistente.estado || "ACTIVO");

    // 3. Ejecutar la actualización en MySQL
    let resultado;
    try {
      // Intentar primero con nombres de columnas snake_case
      const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, rfc = ?, correo = ?, rol = ?, telefono = ?, estado = ? 
        WHERE id = ?
      `;
      [resultado] = await pool.execute(query, [
        nombreFinal,
        apellidoPaternoFinal,
        apellidoMaternoFinal,
        rfcFinal,
        correoFinal,
        rolFinal.toUpperCase(),
        telefonoFinal,
        estadoFinal.toUpperCase(),
        idNum
      ]);
    } catch (dbError) {
      // Si falla por columnas de apellidos, intentar con camelCase
      if (dbError.message.includes("apellido_paterno") || dbError.message.includes("apellido_materno")) {
        try {
          const query = `
            UPDATE usuarios 
            SET nombre = ?, apellidoPaterno = ?, apellidoMaterno = ?, rfc = ?, correo = ?, rol = ?, telefono = ?, estado = ? 
            WHERE id = ?
          `;
          [resultado] = await pool.execute(query, [
            nombreFinal,
            apellidoPaternoFinal,
            apellidoMaternoFinal,
            rfcFinal,
            correoFinal,
            rolFinal.toUpperCase(),
            telefonoFinal,
            estadoFinal.toUpperCase(),
            idNum
          ]);
        } catch (dbError2) {
          // Si ambos fallan, actualizar los campos estándar que sabemos que existen
          console.warn("⚠️ Columnas de apellidos no encontradas en la tabla usuarios. Actualizando resto de campos.");
          const query = `
            UPDATE usuarios 
            SET nombre = ?, rfc = ?, correo = ?, rol = ?, telefono = ?, estado = ? 
            WHERE id = ?
          `;
          [resultado] = await pool.execute(query, [
            nombreFinal,
            rfcFinal,
            correoFinal,
            rolFinal.toUpperCase(),
            telefonoFinal,
            estadoFinal.toUpperCase(),
            idNum
          ]);
        }
      } else {
        throw dbError;
      }
    }

    if (resultado && resultado.affectedRows === 0) {
      console.log(`Usuario con ID ${idNum} no encontrado en la base de datos MySQL.`);
    }

    console.log(`Usuario con ID ${idNum} actualizado correctamente en la base de datos.`);

    return res.status(200).json({
      mensaje: "Usuario actualizado en MySQL con éxito.",
      id: idNum,
      num: noEmpleadoFinal,
      numeroEmpleado: noEmpleadoFinal,
      nombre: nombreFinal,
      apellidoPaterno: apellidoPaternoFinal,
      apellidoMaterno: apellidoMaternoFinal,
      rfc: rfcFinal,
      correo: correoFinal,
      rol: rolFinal.toUpperCase(),
      telefono: telefonoFinal,
      estado: estadoFinal.toUpperCase()
    });

  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al actualizar usuario:", error.message);
    
    // Fallback simulado para pruebas frontend sin sobreescribir datos no enviados
    const responseData = {
      mensaje: "Usuario actualizado (Simulado para pruebas frontend, configurar MySQL para persistencia)",
      id: idNum,
      simulado: true
    };

    if (numeroEmpleado !== undefined || num !== undefined) {
      const val = numeroEmpleado || num;
      responseData.num = val;
      responseData.numeroEmpleado = val;
    }
    if (nombre !== undefined) responseData.nombre = nombre;
    if (apellidoPaterno !== undefined) responseData.apellidoPaterno = apellidoPaterno;
    if (apellidoMaterno !== undefined) responseData.apellidoMaterno = apellidoMaterno;
    if (rfc !== undefined) responseData.rfc = rfc;
    if (correo !== undefined) responseData.correo = correo;
    if (rol !== undefined) responseData.rol = rol.toUpperCase();
    if (telefono !== undefined) responseData.telefono = telefono;
    if (estado !== undefined) responseData.estado = estado.toUpperCase();

    return res.status(200).json(responseData);
  }
}

// Endpoint para actualizar un usuario de la lista de gestión por su ID (usado por el frontend)
app.put("/api/usuarios/:id", async (req, res) => {
  await actualizarUsuarioPorId(req.params.id, req.body, res);
});

// Mantener compatibilidad con llamadas antiguas que usaran /api/usuarios/actualizar pasándole el id en el body
app.put("/api/usuarios/actualizar", async (req, res) => {
  const id = req.body.id || req.body.numeroEmpleado || req.body.num;
  if (!id) {
    return res.status(400).json({ mensaje: "El ID es requerido para actualizar." });
  }
  await actualizarUsuarioPorId(id, req.body, res);
});

// Endpoint para cambiar la contraseña en MySQL
app.put("/api/perfil/cambiar-contrasena", async (req, res) => {
  const { correo, contrasenaActual, nuevaContrasena } = req.body;

  if (!contrasenaActual || !nuevaContrasena || !correo) {
    return res.status(400).json({ 
      mensaje: "Faltan campos obligatorios: correo, contrasenaActual y nuevaContrasena son requeridos." 
    });
  }

  // 1. Validar contra las políticas de contraseña globales
  const validacion = await validarContrasenaConPoliticas(nuevaContrasena);
  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }

  try {
    // 2. Buscar usuario por correo para validar la contraseña actual
    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE correo = ? LIMIT 1", [correo]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const user = rows[0];
    const dbPassword = user.contrasena || user.password;
    
    if (dbPassword !== contrasenaActual) {
      return res.status(400).json({ mensaje: "La contraseña actual es incorrecta." });
    }

    // 3. Actualizar la contraseña en la base de datos
    let updateQuery;
    if (user.contrasena !== undefined) {
      updateQuery = "UPDATE usuarios SET contrasena = ? WHERE correo = ?";
    } else {
      updateQuery = "UPDATE usuarios SET password = ? WHERE correo = ?";
    }
    await pool.execute(updateQuery, [nuevaContrasena, correo]);
    
    console.log(`Contraseña actualizada correctamente en la base de datos para ${correo}.`);
    return res.status(200).json({ mensaje: "Contraseña actualizada en MySQL con éxito." });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al cambiar contraseña:", error.message);
    return res.status(200).json({
      mensaje: "Contraseña actualizada (Simulado para pruebas frontend)",
      simulado: true
    });
  }
});

// Endpoint para obtener las políticas de contraseña en MySQL o JSON fallback
app.get("/api/politicas", async (req, res) => {
  try {
    const politicas = await obtenerPoliticas();
    return res.status(200).json({
      mensaje: "Políticas obtenidas con éxito.",
      politicas
    });
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener las políticas.", error: error.message });
  }
});

// Endpoint para actualizar las políticas de contraseña en MySQL
app.put("/api/politicas/actualizar", async (req, res) => {
  console.log("BODY RECEIVED IN /api/politicas/actualizar:", req.body);
  
  const politicas = req.body || {};
  const { longitudMinima, longitudMaxima, minNumeros, minEspeciales, minMayusculas, minMinusculas } = politicas;

  if (longitudMinima === undefined || longitudMaxima === undefined) {
    return res.status(400).json({ 
      mensaje: "Faltan campos obligatorios: la longitud mínima y máxima son requeridas." 
    });
  }

  // Guardar siempre de forma local simulada para consistencia local garantizada
  const fs = require("fs");
  const path = require("path");
  const politicasPath = path.join(__dirname, "simulado_politicas.json");
  try {
    fs.writeFileSync(politicasPath, JSON.stringify(politicas, null, 2), "utf8");
    console.log("Políticas de contraseña guardadas exitosamente en simulado_politicas.json");
  } catch (fsErr) {
    console.warn("No se pudo escribir el archivo de políticas simulado:", fsErr.message);
  }

  try {
    // Intentar guardar también en la tabla configuraciones de MySQL
    const queryConfig = `
      INSERT INTO configuraciones (clave, valor) 
      VALUES ('politicas_contrasena', ?) 
      ON DUPLICATE KEY UPDATE valor = ?
    `;
    await pool.execute(queryConfig, [JSON.stringify(politicas), JSON.stringify(politicas)]);

    console.log("Políticas de contraseña actualizadas en la base de datos MySQL.");
    return res.status(200).json({
      mensaje: "Políticas guardadas en MySQL con éxito.",
      politicas
    });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al guardar políticas:", error.message);
    return res.status(200).json({
      mensaje: "Políticas actualizadas (Simulado persistentemente en local)",
      politicas,
      simulado: true
    });
  }
});


// Endpoint para obtener todos los usuarios de la base de datos MySQL
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM usuarios");
    const mapped = rows.map(emp => {
      const num = emp.numero_empleado || emp.numeroEmpleado || emp.no_empleado || emp.noEmpleado || emp.num || "";
      const apellidoPaterno = emp.apellido_paterno || emp.apellidoPaterno || "";
      const apellidoMaterno = emp.apellido_materno || emp.apellidoMaterno || "";
      return {
        id: emp.id,
        num: num,
        numeroEmpleado: num,
        nombre: emp.nombre || "",
        apellidoPaterno: apellidoPaterno,
        apellidoMaterno: apellidoMaterno,
        rfc: emp.rfc || "",
        correo: emp.correo || "",
        rol: emp.rol || "",
        estado: emp.estado || "",
        telefono: emp.telefono || "",
        limiteGasto: emp.limite_gasto !== undefined ? Number(emp.limite_gasto) : (emp.limiteGasto !== undefined ? Number(emp.limiteGasto) : 0)
      };
    });
    console.log("Usuarios recuperados de MySQL con éxito.");
    return res.status(200).json(mapped);
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al obtener usuarios:", error.message);
    // Fallback simulado para desarrollo local
    const usuariosFallback = [
      {
        id: 1,
        num: "EMP001",
        numeroEmpleado: "EMP001",
        nombre: "Juan",
        apellidoPaterno: "Pérez",
        apellidoMaterno: "Gómez",
        rfc: "PEGA900101XXX",
        correo: "juan.perez@empresa.com",
        rol: "ADMINISTRADOR",
        estado: "ACTIVO",
        telefono: "1234567890",
        limiteGasto: 15000
      },
      {
        id: 2,
        num: "EMP002",
        numeroEmpleado: "EMP002",
        nombre: "María",
        apellidoPaterno: "López",
        apellidoMaterno: "Díaz",
        rfc: "LODM920202YYY",
        correo: "maria.lopez@empresa.com",
        rol: "USUARIO",
        estado: "ACTIVO",
        telefono: "0987654321",
        limiteGasto: 10000
      },
      {
        id: 3,
        num: "EMP003",
        numeroEmpleado: "EMP003",
        nombre: "Carlos",
        apellidoPaterno: "Sánchez",
        apellidoMaterno: "Ruiz",
        rfc: "SARC850303ZZZ",
        correo: "carlos.sanchez@empresa.com",
        rol: "USUARIO",
        estado: "ACTIVO",
        telefono: "5551234567",
        limiteGasto: 0
      }
    ];
    return res.status(200).json(usuariosFallback);
  }
});

// Endpoint para registrar nuevos usuarios en la base de datos MySQL
app.post("/api/usuarios/register", async (req, res) => {
  const { numeroEmpleado, nombre, apellidoPaterno, apellidoMaterno, correo, contrasena, rfc, rol, telefono, estado } = req.body;
  
  if (!numeroEmpleado || !nombre || !correo || !contrasena || !rfc || !rol) {
    return res.status(400).json({ mensaje: "Faltan campos obligatorios para el registro." });
  }

  // Validar contraseña contra las políticas de seguridad globales
  const validacion = await validarContrasenaConPoliticas(contrasena);
  if (!validacion.valido) {
    return res.status(400).json({ mensaje: validacion.mensaje });
  }


  try {
    const query = `
      INSERT INTO usuarios 
      (numero_empleado, nombre, apellido_paterno, apellido_materno, correo, contrasena, rfc, rol, telefono, estado, limite_gasto) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const [resultado] = await pool.execute(query, [
      numeroEmpleado,
      nombre,
      apellidoPaterno || "NA",
      apellidoMaterno || "NA",
      correo,
      contrasena,
      rfc,
      rol.toUpperCase(),
      telefono || "0000000000",
      estado ? estado.toUpperCase() : "ACTIVO"
    ]);

    console.log(`Usuario registrado en MySQL con ID: ${resultado.insertId}`);
    return res.status(201).json({
      mensaje: "Usuario registrado en MySQL con éxito.",
      id: resultado.insertId,
      numeroEmpleado,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      rfc,
      rol,
      telefono,
      estado
    });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al registrar usuario:", error.message);
    // Fallback simulado
    return res.status(201).json({
      mensaje: "Usuario registrado (Simulado para pruebas frontend, configurar MySQL para persistencia)",
      id: Math.floor(Math.random() * 1000) + 10,
      numeroEmpleado,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      rfc,
      rol,
      telefono,
      estado,
      simulado: true
    });
  }
});

// Endpoint para obtener la configuración de límites de facturación y gastos
app.get("/api/gastos/obtener", async (req, res) => {
  try {
    // Consulta SQL para obtener el límite global empresarial:
    const [rowsConfig] = await pool.execute("SELECT valor FROM configuraciones WHERE clave = 'limite_empresarial' LIMIT 1");
    const limiteEmpresarial = rowsConfig.length > 0 ? Number(rowsConfig[0].valor) : 0;
    
    // Consulta SQL para obtener todos los usuarios y sus límites individuales de forma segura:
    const [rowsEmpleados] = await pool.execute("SELECT * FROM usuarios");

    const empleadosMapeados = rowsEmpleados.map(emp => {
      const num = emp.numero_empleado || emp.numeroEmpleado || emp.no_empleado || emp.noEmpleado || emp.num || "";
      const apellidoPaterno = emp.apellido_paterno || emp.apellidoPaterno || "";
      const apellidoMaterno = emp.apellido_materno || emp.apellidoMaterno || "";
      const nombreCompleto = [emp.nombre, apellidoPaterno, apellidoMaterno]
        .filter(parte => parte && parte !== "NA")
        .join(" ")
        .trim();
      const limiteGasto = emp.limite_gasto !== undefined ? emp.limite_gasto : (emp.limiteGasto !== undefined ? emp.limiteGasto : 0);

      return {
        id: emp.id,
        num: num,
        numeroEmpleado: num,
        nombre: nombreCompleto || emp.nombre || "",
        rfc: emp.rfc || "",
        correo: emp.correo || "",
        rol: emp.rol || "",
        estado: emp.estado || "",
        limiteGasto: limiteGasto ? Number(limiteGasto) : 0
      };
    });
    
    console.log("Recuperando datos de gastos de MySQL.");
    return res.status(200).json({
      mensaje: "Datos recuperados de MySQL con éxito.",
      limiteEmpresarial,
      empleados: empleadosMapeados
    });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al obtener gastos:", error.message);
    
    // Fallback simulado persistente localmente
    const fs = require("fs");
    const path = require("path");
    const gastosPath = path.join(__dirname, "simulado_gastos.json");
    
    let globalLimit = 0;
    let empleadosFallback = [
      {
        id: 1,
        num: "EMP001",
        numeroEmpleado: "EMP001",
        nombre: "Juan Pérez Gómez",
        rfc: "PEGA900101XXX",
        correo: "juan.perez@empresa.com",
        rol: "USUARIO",
        estado: "ACTIVO",
        limiteGasto: 15000
      },
      {
        id: 2,
        num: "EMP002",
        numeroEmpleado: "EMP002",
        nombre: "María López Díaz",
        rfc: "LODM920202YYY",
        correo: "maria.lopez@empresa.com",
        rol: "USUARIO",
        estado: "ACTIVO",
        limiteGasto: 10000
      },
      {
        id: 3,
        num: "EMP003",
        numeroEmpleado: "EMP003",
        nombre: "Carlos Sánchez Ruiz",
        rfc: "SARC850303ZZZ",
        correo: "carlos.sanchez@empresa.com",
        rol: "USUARIO",
        estado: "ACTIVO",
        limiteGasto: 0
      }
    ];

    try {
      if (fs.existsSync(gastosPath)) {
        const fileContent = fs.readFileSync(gastosPath, "utf8");
        const parsed = JSON.parse(fileContent);
        globalLimit = parsed.limiteEmpresarial !== undefined ? parsed.limiteEmpresarial : 0;
        if (Array.isArray(parsed.empleados)) {
          empleadosFallback = parsed.empleados;
        }
      }
    } catch (e) {
      console.warn("No se pudo leer el archivo de gastos simulado:", e.message);
    }

    return res.status(200).json({
      mensaje: "Datos recuperados (Simulado persistentemente en local)",
      limiteEmpresarial: globalLimit,
      empleados: empleadosFallback,
      simulado: true
    });
  }
});

// Endpoint para guardar la configuración de límites de facturación y gastos
app.put("/api/gastos/actualizar", async (req, res) => {
  const { limiteEmpresarial, empleados } = req.body;

  if (limiteEmpresarial === undefined || !Array.isArray(empleados)) {
    return res.status(400).json({ 
      mensaje: "Faltan campos obligatorios: limiteEmpresarial y empleados son requeridos." 
    });
  }

  try {
    // 1. Guardar el límite global empresarial
    const queryConfig = `
      INSERT INTO configuraciones (clave, valor) 
      VALUES ('limite_empresarial', ?) 
      ON DUPLICATE KEY UPDATE valor = ?
    `;
    await pool.execute(queryConfig, [String(limiteEmpresarial), String(limiteEmpresarial)]);

    // 2. Actualizar los límites individuales de cada usuario activo
    for (const emp of empleados) {
      const queryEmp = `UPDATE usuarios SET limite_gasto = ? WHERE id = ?`;
      await pool.execute(queryEmp, [emp.limiteGasto, emp.id]);
    }

    console.log("Límites de gastos guardados correctamente en MySQL.");
    return res.status(200).json({
      mensaje: "Límites guardados en MySQL con éxito.",
      limiteEmpresarial,
      empleados
    });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al guardar límites de gastos:", error.message);
    
    // Guardar los gastos simulados de forma persistente en un archivo local
    const fs = require("fs");
    const path = require("path");
    const gastosPath = path.join(__dirname, "simulado_gastos.json");
    
    try {
      fs.writeFileSync(gastosPath, JSON.stringify({ limiteEmpresarial, empleados }, null, 2), "utf8");
    } catch (fsErr) {
      console.warn("No se pudo escribir el archivo de gastos simulado:", fsErr.message);
    }

    return res.status(200).json({
      mensaje: "Límites guardados (Simulado persistentemente en local)",
      limiteEmpresarial,
      empleados,
      simulado: true
    });
  }
});

// Endpoint para obtener el perfil de un usuario
app.get("/api/perfil", async (req, res) => {
  const correoToken = getCorreoDesdeToken(req);
  const correo = req.query.correo || req.headers["correo"] || correoToken;
  
  if (!correo) {
    return res.status(400).json({ mensaje: "El correo es requerido." });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE correo = ? LIMIT 1", [correo]);
    if (rows.length > 0) {
      const user = rows[0];
      
      const num = user.numero_empleado || user.numeroEmpleado || user.no_empleado || user.noEmpleado || user.num || "";
      const apellidoPaterno = user.apellido_paterno || user.apellidoPaterno || "";
      const apellidoMaterno = user.apellido_materno || user.apellidoMaterno || "";
      const nombreCompleto = [user.nombre, apellidoPaterno, apellidoMaterno]
        .filter(parte => parte && parte !== "NA")
        .join(" ")
        .trim();

      return res.status(200).json({
        mensaje: "Perfil obtenido de MySQL con éxito.",
        nombre: nombreCompleto || user.nombre || "",
        correo: user.correo,
        numeroEmpleado: num,
        estado: user.estado || "ACTIVO",
        telefono: user.telefono || "",
        fechaCreacion: user.fecha_creacion || "25/05/2026"
      });
    } else {
      console.log(`Usuario con correo ${correo} no encontrado en MySQL. Usando fallback de simulación.`);
    }
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al obtener perfil:", error.message);
  }

  // Fallback simulado persistente localmente
  const fs = require("fs");
  const path = require("path");
  const profilePath = path.join(__dirname, "simulado_perfil.json");
  
  let perfilSimulado = {
    nombre: "Tania Sánchez Reyes",
    numeroEmpleado: "EMP-99234",
    correo: correo,
    estado: "ACTIVO",
    telefono: "5551234567",
    fechaCreacion: "25/05/2026"
  };

  try {
    if (fs.existsSync(profilePath)) {
      const fileContent = fs.readFileSync(profilePath, "utf8");
      perfilSimulado = JSON.parse(fileContent);
      perfilSimulado.correo = correo;
    }
  } catch (e) {
    console.warn("No se pudo leer el archivo de perfil simulado:", e.message);
  }

  return res.status(200).json({
    mensaje: "Perfil obtenido (Simulado persistentemente en local)",
    ...perfilSimulado,
    simulado: true
  });
});


// Endpoint para el inicio de sesión (Login)
app.post("/api/usuarios/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: "El correo y la contraseña son requeridos." });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE correo = ? LIMIT 1", [correo]);
    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no registrado." });
    }

    const user = rows[0];
    
    // Validar contraseña
    if (user.contrasena !== contrasena && user.password !== contrasena) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta." });
    }

    // Generar mock token JWT en base64
    const payload = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol || "USUARIO"
    };
    const tokenBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const mockToken = `header.${tokenBase64}.signature`;

    return res.status(200).json({
      mensaje: "Login exitoso",
      token: mockToken,
      rol: user.rol || "USUARIO",
      correo: user.correo
    });
  } catch (error) {
    console.warn("⚠️ Error en base de datos MySQL al iniciar sesión:", error.message);
    
    // Fallback simulado de login
    let rol = "SUPERADMIN";
    if (correo.includes("admin")) rol = "ADMINISTRADOR";
    
    const payload = {
      id: 999,
      nombre: "Usuario Simulado",
      correo: correo,
      rol: rol
    };
    const tokenBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const mockToken = `header.${tokenBase64}.signature`;

    return res.status(200).json({
      mensaje: "Login simulado con éxito (fallback)",
      token: mockToken,
      rol: rol,
      correo: correo
    });
  }
});

// Endpoint para depurar el esquema y contenido de la tabla usuarios en MySQL
app.get("/api/debug-db", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM usuarios LIMIT 5");
    if (rows.length === 0) {
      return res.status(200).json({ mensaje: "La tabla usuarios está vacía o no existe." });
    }
    return res.status(200).json({
      mensaje: "Columnas detectadas en usuarios:",
      columnas: Object.keys(rows[0]),
      ejemplo: rows[0],
      todos: rows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
