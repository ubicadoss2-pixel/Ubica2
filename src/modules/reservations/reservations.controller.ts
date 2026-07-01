import { Request, Response } from "express";
import { sendEmail } from "../../shared/utils/email";

export const confirmReservation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { placeName, date, time, guests, type, email, ownerEmail, extras, total } = req.body;

    const extrasHtml = extras && extras.length > 0 
      ? `<ul>${extras.map((e: any) => `<li>${e.name}: $${e.price.toLocaleString()}</li>`).join('')}</ul>`
      : '<p>Ninguno</p>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #7c3aed; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Factura Electrónica</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Confirmación de Reserva</p>
        </div>
        
        <div style="padding: 30px;">
          <p>Hola <strong>${user.fullName || 'Usuario'}</strong>,</p>
          <p>Tu reserva en <strong>${placeName}</strong> ha sido confirmada con éxito. A continuación encontrarás los detalles de tu factura electrónica:</p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Fecha y Hora:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${date} a las ${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Personas:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guests}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Tipo de Reserva:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Extras:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 0.9em;">${extrasHtml}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; text-align: right;">
              <span style="font-size: 1.2rem; color: #666;">Total Pagado:</span>
              <span style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-left: 10px;">$${total.toLocaleString()}</span>
            </div>
          </div>
          
          <p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 30px;">
            ¡Gracias por usar Ubica2! Esperamos que disfrutes tu experiencia.
          </p>
        </div>
      </div>
    `;

    // Intentar enviar correo
    const emailSent = await sendEmail({
      to: email || user.email,
      subject: `Confirmación de Reserva en ${placeName} - Ubica2`,
      html
    });

    if (ownerEmail) {
      const ownerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Nueva Reserva</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Has recibido una nueva reserva en ${placeName}</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Hola,</p>
            <p>Se ha realizado una nueva reserva en <strong>${placeName}</strong> por parte de <strong>${user.fullName || 'Usuario'}</strong> (${email || user.email}).</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Fecha y Hora:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${date} a las ${time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Personas:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guests}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Tipo de Reserva:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Extras:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 0.9em;">${extrasHtml}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 30px;">
              Ubica2 - Panel de Propietario
            </p>
          </div>
        </div>
      `;
      await sendEmail({
        to: ownerEmail,
        subject: `Nueva reserva en ${placeName} - Ubica2`,
        html: ownerHtml
      });
    }

    if (emailSent) {
      res.status(200).json({ 
        message: "Reserva confirmada y correo enviado exitosamente.",
        previewUrl: typeof emailSent === 'string' ? emailSent : undefined
      });
    } else {
      // Incluso si falla el correo, confirmamos la reserva para que el UI no se bloquee.
      res.status(200).json({ message: "Reserva confirmada, pero hubo un problema al enviar el correo." });
    }

  } catch (error: any) {
    console.error("Error al confirmar reserva:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};
