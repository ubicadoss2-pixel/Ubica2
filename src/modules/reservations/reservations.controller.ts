import { Request, Response } from "express";
import { sendEmail } from "../../shared/utils/email";
import { createReservation, getReservationsByOwner } from "./reservations.service";

export const confirmReservation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { placeId, placeName, date, time, guests, guestName, reason, observations, email, ownerEmail } = req.body;

    // Guardar reserva en base de datos
    await createReservation({
      placeId,
      userId: user?.id,
      guestName: guestName || user?.fullName || 'Invitado',
      date,
      time,
      guests: Number(guests),
      reason,
      observations
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #7c3aed; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Reserva Confirmada</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Comprobante de Reserva</p>
        </div>
        
        <div style="padding: 30px;">
          <p>Hola <strong>${guestName || user?.fullName || 'Usuario'}</strong>,</p>
          <p>Tu reserva en <strong>${placeName}</strong> ha sido confirmada con éxito. A continuación encontrarás los detalles:</p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">A nombre de:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guestName || user?.fullName || 'Usuario'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Lugar:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${placeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Fecha y Hora:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${date} a las ${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Personas:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guests}</td>
              </tr>
              ${reason ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Motivo:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${reason}</td>
              </tr>` : ''}
              ${observations ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Observaciones:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 0.9em;">${observations}</td>
              </tr>` : ''}
            </table>
          </div>
          
          <p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 30px;">
            ¡Gracias por usar Ubica2! Esperamos que disfrutes tu experiencia.
          </p>
        </div>
      </div>
    `;

    // Intentar enviar correo (en segundo plano)
    sendEmail({
      to: email || user?.email,
      subject: `Confirmación de Reserva en ${placeName} - Ubica2`,
      html
    }).catch(err => console.error("Error enviando email cliente:", err));

    if (ownerEmail) {
      const ownerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Nueva Reserva</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Has recibido una nueva reserva en ${placeName}</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Hola,</p>
            <p>Se ha realizado una nueva reserva en <strong>${placeName}</strong> por parte de <strong>${guestName || user?.fullName || 'Usuario'}</strong>.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">A nombre de:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guestName || user?.fullName || 'Usuario'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Fecha y Hora:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${date} a las ${time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Personas:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${guests}</td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Motivo:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-weight: bold;">${reason}</td>
                </tr>` : ''}
                ${observations ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; color: #666;">Observaciones:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; text-align: right; font-size: 0.9em;">${observations}</td>
                </tr>` : ''}
              </table>
            </div>
            
            <p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 30px;">
              Ubica2 - Panel de Propietario
            </p>
          </div>
        </div>
      `;
      sendEmail({
        to: ownerEmail,
        subject: `Nueva reserva en ${placeName} - Ubica2`,
        html: ownerHtml
      }).catch(err => console.error("Error enviando email owner:", err));
    }

    res.status(200).json({ 
      message: "Reserva confirmada y guardada exitosamente."
    });

  } catch (error: any) {
    console.error("Error al confirmar reserva:", error);
    res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};

export const getOwnerReservations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const reservations = await getReservationsByOwner(user.id);
    res.status(200).json({ items: reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
