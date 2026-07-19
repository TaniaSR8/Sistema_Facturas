require("dotenv").config();
const { enviarCorreoRecuperacion } = require("./src/config/mailer");


const correoDestino = " sistemafacturas.empresa@gmail.com"; // cámbialo por uno tuyo real donde puedas revisar

enviarCorreoRecuperacion(correoDestino, "Prueba", "http://localhost:5173/restablecer-contrasena?token=abc123")
    .then(() => {
        console.log("✅ Correo enviado correctamente. Revisa tu bandeja de entrada (o spam).");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error al enviar correo:", err);
        process.exit(1);
    });