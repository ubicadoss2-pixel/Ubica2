import { prisma } from "../../config/prisma";

export const getMyVerification = async (userId: string) => {
  // @ts-ignore
  return (prisma as any).verification.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

export const createVerification = async (data: { userId: string, fullName: string, documentType: string, documentNumber: string, fileUrl: string }) => {
  // @ts-ignore
  const existing = await (prisma as any).verification.findFirst({
    where: { userId: data.userId, status: "PENDING" }
  });

  if (existing) {
    throw new Error("Ya tienes una verificación pendiente.");
  }

  // @ts-ignore
  return (prisma as any).verification.create({
    data: {
      userId: data.userId,
      fullName: data.fullName,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      fileUrl: data.fileUrl,
      status: "PENDING",
    }
  });
};

export const listVerifications = async () => {
  // @ts-ignore
  return (prisma as any).verification.findMany({
    include: {
      user: {
        select: { email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const changeStatus = async (id: string, status: string) => {
  // @ts-ignore
  const v = await (prisma as any).verification.update({
    where: { id },
    data: { status }
  });

  if (status === 'APPROVED' && v) {
    const ownerRole = await prisma.role.findUnique({
      where: { code: 'OWNER' }
    });
    
    if (ownerRole) {
      // Create or update userRole for this user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: v.userId,
            roleId: ownerRole.id
          }
        },
        create: {
          userId: v.userId,
          roleId: ownerRole.id
        },
        update: {} // do nothing if it exists
      });
    }
  }

  return v;
};
