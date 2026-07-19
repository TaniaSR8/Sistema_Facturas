const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const enviarCorreoRecuperacion = async (destinatario, nombre, enlace) => {
    const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0059B3;">Recuperación de contraseña</h2>
      <p>Hola ${nombre || ""},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en el Sistema de Control de Facturas.</p>
      <p>
        <a href="${enlace}"
           style="display:inline-block; background:#0059B3; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
          Restablecer contraseña
        </a>
      </p>
      <p>Este enlace es válido por 1 hora. Si tú no solicitaste esto, puedes ignorar este correo.</p>
    </div>
  `;

    await transporter.sendMail({
        from: `"Sistema de Control de Facturas" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: "Recuperación de contraseña",
        html,
    });
};

module.exports = { enviarCorreoRecuperacion };