import { prisma } from "../../../config/prisma";
import { CreateBusinessDTO } from "../business.schema";
import { cacheGet, cacheSet, cacheDel } from "../../../shared/utils/cache";


// NEGOCIOS CERCANOS
export const getNearbyBusinesses = async (
  lat: number,
  lng: number,
  radius = 5000
) => {

  const businesses = await prisma.$queryRawUnsafe(`
    SELECT *,
    ST_Distance_Sphere(
      point(longitud, latitud),
      point(${lng}, ${lat})
    ) as distance
    FROM businesses
    HAVING distance < ${radius}
    ORDER BY distance;
  `);

  return businesses;
};


// 🔥 CREAR NEGOCIO (SaaS ready)
export const createBusiness = async (
  data: CreateBusinessDTO,
  userId: number
) => {

  const subscription = await prisma.subscriptions.findFirst({
  where: {
    merchant_id: userId,
    estado: "activa",
    fecha_fin: {
      gt: new Date()
    }
  }
});


  if (!subscription) {
    throw new Error("Necesitas un plan activo para crear negocios");
  }

  return prisma.businesses.create({
    data: {
      ...data,
      merchant_id: userId
    }
  });
};
// 🔥 BUSCADOR PRO
export const searchBusinesses = async (
  name?: string,
  ciudad?: string,
  categoria_id?: number
) => {

  return prisma.businesses.findMany({
    where: {
      AND: [
        name
          ? {
              nombre: {
                contains: name,
              }
            }
          : {},

        ciudad
          ? {
              ciudad: {
                contains: ciudad,
              }
            }
          : {},

        categoria_id
          ? { categoria_id }
          : {}
      ]
    }
  });

};

export const getBusinessById = async (businessId: number) => {
  const key = `business:${businessId}`;
  const cached = cacheGet<any>(key);
  if (cached) return cached;

  const business = await prisma.businesses.findUnique({
    where: { id: businessId },
    include: {
      business_images: {
        where: { is_primary: true },
        take: 1,
      },
    },
  });

  if (!business) return null;

  // Normalizar primary image
  const primary = business.business_images && business.business_images[0] ? business.business_images[0] : null;

  const result = { ...business, primary_image: primary };

  cacheSet(key, result);

  return result;
};

