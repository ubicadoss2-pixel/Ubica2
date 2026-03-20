import cloudinary from "../../../config/cloudinary";
import streamifier from "streamifier";
import { prisma } from "../../../config/prisma";
import { cacheDel } from "../../../shared/utils/cache";


// ================================
// SUBIR A CLOUDINARY
// ================================

export const uploadBusinessImage = (
  file: Express.Multer.File
): Promise<string> => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ubica2/businesses",
        transformation: [
          { width: 1200, crop: "limit" },
          { quality: "auto" }
        ]
      },
      (error, result) => {

        if (error) return reject(error);

        resolve(result!.secure_url);
      }
    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(stream);
  });
};



// ================================
// AGREGAR IMAGEN (SaaS READY)
// ================================

export const addBusinessImage = async (
  businessId: number,
  file: Express.Multer.File,
  userId: number
) => {

  //------------------------------------------------
  // 1️⃣ VALIDAR NEGOCIO
  //------------------------------------------------

  const business = await prisma.businesses.findUnique({
    where: { id: businessId }
  });

  if (!business)
    throw new Error("Negocio no existe");

  if (business.merchant_id !== userId)
    throw new Error("No eres dueño de este negocio");


  //------------------------------------------------
  // 2️⃣ OBTENER PLAN ACTIVO
  //------------------------------------------------

  const subscription = await prisma.subscriptions.findFirst({
    where: {
      merchant_id: userId,
      estado: "activa"
    },
    include: {
      plans: true
    }
  });

  if (!subscription)
    throw new Error("Necesitas un plan activo");


  //------------------------------------------------
  // 3️⃣ VALIDAR LIMITE DE IMAGENES
  //------------------------------------------------

  const totalImages = await prisma.business_images.count({
    where: { business_id: businessId }
  });

  if (totalImages >= subscription.plans.max_images) {
    throw new Error(
      `Tu plan permite máximo ${subscription.plans.max_images} imágenes`
    );
  }


  //------------------------------------------------
  // 4️⃣ SUBIR IMAGEN
  //------------------------------------------------

  const imageUrl = await uploadBusinessImage(file);


  //------------------------------------------------
  // 5️⃣ PRIMERA IMAGEN = PRINCIPAL
  //------------------------------------------------

  // En planes FREE no permitimos imagen primaria
  const isPrimary = totalImages === 0 && subscription.plans.nombre !== "FREE";


  //------------------------------------------------
  // 6️⃣ GUARDAR
  //------------------------------------------------
  const created = await prisma.business_images.create({
    data: {
      business_id: businessId,
      url: imageUrl,
      is_primary: isPrimary
    },
  });

  try { cacheDel(`business:${businessId}`); } catch (e) {}

  return created;
};
export const setPrimaryImage = async (
  businessId: number,
  imageId: number,
  userId: number
) => {
  const business = await prisma.businesses.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new Error("Negocio no existe");
  }

  if (business.merchant_id !== userId) {
    throw new Error("No eres dueño del negocio");
  }

  // Verificar plan: FREE no puede asignar primaria
  const subscription = await prisma.subscriptions.findFirst({
    where: { merchant_id: userId, estado: "activa" },
    include: { plans: true },
  });

  if (!subscription) throw new Error("Necesitas un plan activo");
  if (subscription.plans.nombre === "FREE") {
    throw new Error("Tu plan no permite establecer imagen primaria");
  }

  const image = await prisma.business_images.findUnique({
    where: { id: imageId },
  });

  if (!image || image.business_id !== businessId) {
    throw new Error("Imagen no válida para este negocio");
  }

  // 🔥 Quitar primaria a todas
  await prisma.business_images.updateMany({
    where: { business_id: businessId },
    data: { is_primary: false },
  });

  // 🔥 Poner esta como primaria
  const updated = await prisma.business_images.update({
    where: { id: imageId },
    data: { is_primary: true },
  });

  try { cacheDel(`business:${businessId}`); } catch (e) {}

  return updated;
};

// BORRAR IMAGEN y sincronizar con Cloudinary
export const deleteBusinessImage = async (
  businessId: number,
  imageId: number,
  userId: number
) => {
  const business = await prisma.businesses.findUnique({ where: { id: businessId } });
  if (!business) throw new Error("Negocio no existe");
  if (business.merchant_id !== userId) throw new Error("No eres dueño del negocio");

  const image = await prisma.business_images.findUnique({ where: { id: imageId } });
  if (!image || image.business_id !== businessId) throw new Error("Imagen no válida para este negocio");

  // Intentar borrar en Cloudinary (siempre que podamos extraer public_id)
  try {
    const url = image.url;
    // Extraer public_id a partir de la URL
    // Ej: https://res.cloudinary.com/<cloud>/image/upload/v1234567890/ubica2/businesses/abc.jpg
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      let publicPath = url.substring(uploadIndex + "/upload/".length);
      // quitar versión si existe (/v123.../)
      publicPath = publicPath.replace(/v[0-9]+\//, "");
      // quitar extensión
      publicPath = publicPath.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, "");

      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicPath, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    }
  } catch (err) {
    // no bloquear el flujo si falla la eliminación en Cloudinary
    console.warn("Error eliminando en Cloudinary:", err);
  }

  // Guardar si era primaria
  const wasPrimary = image.is_primary;

  // Borrar registro en DB
  await prisma.business_images.delete({ where: { id: imageId } });

  // Si era primaria, intentar reasignar (si plan lo permite)
  if (wasPrimary) {
    const subscription = await prisma.subscriptions.findFirst({
      where: { merchant_id: userId, estado: "activa" },
      include: { plans: true },
    });

    if (subscription && subscription.plans.nombre !== "FREE") {
      const nextImage = await prisma.business_images.findFirst({
        where: { business_id: businessId },
        orderBy: { id: "asc" },
      });
      if (nextImage) {
        await prisma.business_images.update({ where: { id: nextImage.id }, data: { is_primary: true } });
      }
    }
  }

  // Invalidar cache del negocio
  try { cacheDel(`business:${businessId}`); } catch (e) {}

  return { success: true };
};

