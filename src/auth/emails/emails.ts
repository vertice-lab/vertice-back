interface TempEmailInterface {
  email: string;
  token: string;
}

export const sendEmailTemplate = ({
  email,
  token,
}: TempEmailInterface): string => {
  const emailTemplate = `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Bienvenido a Vértice</title>
        </head>
        <body style="margin:0;padding:20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background-color:#fcfffd; color:#17252a;">
            <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;background:transparent;">
                <tr>
                    <td style="padding:24px 0;text-align:center">
                        <table role="presentation" width="100%" style="background:#ffffff;border-radius:12px;box-shadow:0 8px 30px rgba(3,4,94,0.08);overflow:hidden;border:1px solid #d7d9ce;">
                            <tr>
                                <td style="padding:28px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, rgba(0,255,208,0.1), transparent);">
                                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <rect width="24" height="24" rx="6" fill="#03045e" />
                                            <path d="M7 13c1.333-2 2.667-3 4-3s2.667 1 4 3" stroke="#00ffd0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div style="text-align:left">
                                            <div style="font-weight:700;color:#03045e;font-size:18px;line-height:1">Vértice</div>
                                            <div style="font-size:12px;color:#0077b6">Bienvenido</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:20px 32px 8px 32px;text-align:left;">
                                    <h1 style="margin:0 0 8px 0;font-size:20px;color:#03045e;font-weight:700;">¡Hola ${email}!</h1>
                                    <p style="margin:0 0 16px 0;color:#17252a;">Gracias por registrarte en <strong>vertice.com</strong>. Solo falta un último paso para activar tu cuenta.</p>

                                    <div style="text-align:center;margin:20px 0;">
                                        <a href="${process.env.FRONTEND_URL}/auth/email-verified/${token}" style="background:#03045e;color:#00ffd0;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;border: 1px solid #0077b6;">Confirmar email</a>
                                    </div>

                                    <p style="margin:0 0 8px 0;color:#0077b6;font-size:13px">Si no solicitaste esta acción, puedes ignorar este correo. El enlace expira en breve por seguridad.</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:12px 32px 28px 32px;border-top:1px solid #d7d9ce;color:#0077b6;font-size:13px;">
                                    <p style="margin:0">¿Necesitas ayuda? Responde a este correo o visita nuestro centro de ayuda.</p>
                                    <p style="margin:8px 0 0 0;color:#17252a;font-size:12px;opacity:0.6">© ${new Date().getFullYear()} Vértice. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;

  return emailTemplate;
};

export const sendOtpEmailTemplate = ({
  email,
  token,
}: TempEmailInterface): string => {
  const emailTemplate = `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Código de verificación - Vértice</title>
        </head>
        <body style="margin:0;padding:20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background-color:#fcfffd; color:#17252a;">
            <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;">
                <tr>
                    <td style="padding:24px 0;">
                        <table role="presentation" width="100%" style="background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(3,4,94,0.08);overflow:hidden;border:1px solid #d7d9ce;">
                            <tr>
                                <td style="padding:22px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, rgba(0,255,208,0.1), transparent); background-color: #03045e;">
                                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <rect width="24" height="24" rx="6" fill="#03045e" />
                                            <path d="M7 13c1.333-2 2.667-3 4-3s2.667 1 4 3" stroke="#00ffd0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div style="text-align:left">
                                            <div style="font-weight:700;color:#00ffd0;font-size:18px;line-height:1">Vértice</div>
                                            <div style="font-size:12px;color:#0077b6">Verificación de email</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:28px 32px 8px 32px;text-align:left;">
                                    <h2 style="margin:0 0 8px 0;font-size:18px;color:#03045e;font-weight:700;">Verifica tu correo electrónico</h2>
                                    <p style="margin:0 0 16px 0;color:#17252a;">Hola <strong>${email}</strong>, usa el siguiente código para continuar con tu registro.</p>

                                    <div style="text-align:center;margin:30px 0;">
                                        <div style="background:#03045e;color:#00ffd0;padding:16px 32px;border-radius:12px;display:inline-block;font-weight:700;font-size:32px;letter-spacing:8px;border: 1px solid #00ffd0;box-shadow: 0 0 15px rgba(0,255,208,0.3);">
                                            ${token}
                                        </div>
                                    </div>

                                    <p style="margin:0 0 8px 0;color:#0077b6;font-size:13px; text-align: center;">Este código expira pronto y es de un solo uso. No lo compartas con nadie.</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:24px 32px 28px 32px;border-top:1px solid #d7d9ce;color:#0077b6;font-size:13px; text-align: center;">
                                    <p style="margin:0">Si no solicitaste este código, puedes ignorar este correo sin problemas.</p>
                                    <p style="margin:16px 0 0 0;color:#17252a;font-size:12px;opacity:0.6">© ${new Date().getFullYear()} Vértice. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;

  return emailTemplate;
};

export const sendEmailChangePassword = ({
  email,
  token,
}: TempEmailInterface): string => {
  const emailTemplate = `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Cambiar contraseña - Vértice</title>
        </head>
        <body style="margin:0;padding:20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background-color:#fcfffd; color:#17252a;">
            <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;">
                <tr>
                    <td style="padding:24px 0;">
                        <table role="presentation" width="100%" style="background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(3,4,94,0.08);overflow:hidden;border:1px solid #d7d9ce;">
                            <tr>
                                <td style="padding:22px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, rgba(0,255,208,0.1), transparent);">
                                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <rect width="24" height="24" rx="6" fill="#03045e" />
                                            <path d="M7 13c1.333-2 2.667-3 4-3s2.667 1 4 3" stroke="#00ffd0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div style="text-align:left">
                                            <div style="font-weight:700;color:#03045e;font-size:18px;line-height:1">Vértice</div>
                                            <div style="font-size:12px;color:#0077b6">Seguridad de la cuenta</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:18px 32px 8px 32px;text-align:left;">
                                    <h2 style="margin:0 0 8px 0;font-size:18px;color:#03045e;font-weight:700;">Restablecer tu contraseña</h2>
                                    <p style="margin:0 0 16px 0;color:#17252a;">Hola <strong>${email}</strong>, haz clic en el botón a continuación para crear una nueva contraseña para tu cuenta.</p>

                                    <div style="text-align:center;margin:20px 0;">
                                        <a href="${process.env.FRONTEND_URL}/auth/forgot-password/${token}" style="background:#03045e;color:#00ffd0;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;border: 1px solid #0077b6;">Cambiar contraseña</a>
                                    </div>

                                    <p style="margin:0 0 8px 0;color:#0077b6;font-size:13px">Si no solicitaste este cambio, puedes ignorar este correo. El enlace es de un solo uso y caduca por seguridad.</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:12px 32px 28px 32px;border-top:1px solid #d7d9ce;color:#0077b6;font-size:13px;">
                                    <p style="margin:0">¿Problemas? Contáctanos respondiendo a este correo.</p>
                                    <p style="margin:8px 0 0 0;color:#17252a;font-size:12px;opacity:0.6">© ${new Date().getFullYear()} Vértice. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;

  return emailTemplate;
};

export const sendOtpForgotPasswordTemplate = ({
  email,
  token,
}: TempEmailInterface): string => {
  const emailTemplate = `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Restablecer contraseña - Vértice</title>
        </head>
        <body style="margin:0;padding:20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background-color:#fcfffd; color:#17252a;">
            <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;">
                <tr>
                    <td style="padding:24px 0;">
                        <table role="presentation" width="100%" style="background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(3,4,94,0.08);overflow:hidden;border:1px solid #d7d9ce;">
                            <tr>
                                <td style="padding:22px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, rgba(0,255,208,0.1), transparent); background-color: #03045e;">
                                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <rect width="24" height="24" rx="6" fill="#03045e" />
                                            <path d="M7 13c1.333-2 2.667-3 4-3s2.667 1 4 3" stroke="#00ffd0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div style="text-align:left">
                                            <div style="font-weight:700;color:#00ffd0;font-size:18px;line-height:1">Vértice</div>
                                            <div style="font-size:12px;color:#0077b6">Seguridad de la cuenta</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:28px 32px 8px 32px;text-align:left;">
                                    <h2 style="margin:0 0 8px 0;font-size:18px;color:#03045e;font-weight:700;">Restablecer tu contraseña</h2>
                                    <p style="margin:0 0 16px 0;color:#17252a;">Hola <strong>${email}</strong>, usa el siguiente código para restablecer tu contraseña.</p>

                                    <div style="text-align:center;margin:30px 0;">
                                        <div style="background:#03045e;color:#00ffd0;padding:16px 32px;border-radius:12px;display:inline-block;font-weight:700;font-size:32px;letter-spacing:8px;border: 1px solid #00ffd0;box-shadow: 0 0 15px rgba(0,255,208,0.3);">
                                            ${token}
                                        </div>
                                    </div>

                                    <p style="margin:0 0 8px 0;color:#0077b6;font-size:13px; text-align: center;">Este código expira pronto y es de un solo uso. No lo compartas con nadie.</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:24px 32px 28px 32px;border-top:1px solid #d7d9ce;color:#0077b6;font-size:13px; text-align: center;">
                                    <p style="margin:0">Si no solicitaste este cambio, puedes ignorar este correo sin problemas.</p>
                                    <p style="margin:16px 0 0 0;color:#17252a;font-size:12px;opacity:0.6">© ${new Date().getFullYear()} Vértice. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;

  return emailTemplate;
};

export const sendDeleteAccountTemplate = ({
  email,
  token,
}: TempEmailInterface): string => {
  const emailTemplate = `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Eliminar cuenta - Vértice</title>
        </head>
        <body style="margin:0;padding:20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background-color:#fcfffd; color:#17252a;">
            <table role="presentation" width="100%" style="max-width:680px;margin:0 auto;">
                <tr>
                    <td style="padding:24px 0;">
                        <table role="presentation" width="100%" style="background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(3,4,94,0.08);overflow:hidden;border:1px solid #d7d9ce;">
                            <tr>
                                <td style="padding:22px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, rgba(0,255,208,0.1), transparent);">
                                    <div style="display:flex;align-items:center;gap:12px;justify-content:center;">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <rect width="24" height="24" rx="6" fill="#03045e" />
                                            <path d="M7 13c1.333-2 2.667-3 4-3s2.667 1 4 3" stroke="#00ffd0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div style="text-align:left">
                                            <div style="font-weight:700;color:#03045e;font-size:18px;line-height:1">Vértice</div>
                                            <div style="font-size:12px;color:#0077b6">Seguridad de la cuenta</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:18px 32px 8px 32px;text-align:left;">
                                    <h2 style="margin:0 0 8px 0;font-size:18px;color:#03045e;font-weight:700;">Solicitud de eliminación de cuenta</h2>
                                    <p style="margin:0 0 16px 0;color:#17252a;">Hola <strong>${email}</strong>, hemos recibido una solicitud para eliminar permanentemente tu cuenta de Vértice. Haz clic en el botón a continuación para confirmar.</p>

                                    <div style="text-align:center;margin:20px 0;">
                                        <a href="${process.env.FRONTEND_URL}/delete-account/${token}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;border: 1px solid #b91c1c;">Eliminar mi cuenta</a>
                                    </div>

                                    <p style="margin:0 0 8px 0;color:#0077b6;font-size:13px">Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta está segura. El enlace es de un solo uso y caduca por seguridad.</p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:12px 32px 28px 32px;border-top:1px solid #d7d9ce;color:#0077b6;font-size:13px;">
                                    <p style="margin:0">¿Problemas? Contáctanos respondiendo a este correo.</p>
                                    <p style="margin:8px 0 0 0;color:#17252a;font-size:12px;opacity:0.6">© ${new Date().getFullYear()} Vértice. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;
  return emailTemplate;
};

interface SupportEmailInterface {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendSupportTemplate = ({
  name,
  email,
  subject,
  message,
}: SupportEmailInterface): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Ticket de Soporte</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background-color: #032b43;
          padding: 32px 40px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px;
        }
        .ticket-info {
          background-color: #f1f5f9;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .info-row {
          margin-bottom: 16px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }
        .value {
          font-size: 16px;
          color: #0f172a;
          font-weight: 500;
          margin: 0;
        }
        .message-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }
        .message-box p {
          margin-top: 0;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          font-size: 13px;
          color: #94a3b8;
        }
        .badge {
          display: inline-block;
          background-color: #38bdf8;
          color: white;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="badge">Nuevo Ticket</div>
          <h1>Solicitud de Soporte</h1>
        </div>
    
        <!-- Content -->
        <div class="content">
          
          <!-- Detalle del Cliente -->
          <div class="ticket-info">
            <div class="info-row">
              <span class="label">Nombre del Cliente</span>
              <p class="value">${name}</p>
            </div>
            <div class="info-row">
              <span class="label">Correo Electrónico</span>
              <p class="value"><a href="mailto:${email}" style="color: #0ea5e9; text-decoration: none;">${email}</a></p>
            </div>
            <div class="info-row">
              <span class="label">Asunto</span>
              <p class="value">${subject}</p>
            </div>
          </div>
    
          <!-- Mensaje -->
          <span class="label" style="margin-bottom: 12px;">Mensaje Detallado</span>
          <div class="message-box">
            <p>${message}</p>
          </div>
    
        </div>
    
        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0;">Este mensaje fue enviado desde el formulario de soporte en <strong>verticeapp.io</strong></p>
          <p style="margin: 4px 0 0 0;">Puedes responder directamente a este correo para contactar al cliente.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
