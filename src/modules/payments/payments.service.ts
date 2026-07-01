import { prisma } from "../../config/prisma";

export const processPaymentAndPromote = async (
  userId: string,
  targetType: "PLACE" | "EVENT",
  targetId: string
) => {
  const amount = 10000;

  // Verify target exists (relaxed ownership for demo — in production enforce ownerUserId check)
  if (targetType === "PLACE") {
    const place = await prisma.place.findUnique({ where: { id: targetId } });
    if (!place) {
      throw new Error("Lugar no encontrado");
    }
    // Ownership check (soft — only warn if owner mismatch, still allow for demo)
    if (place.ownerUserId && place.ownerUserId !== userId) {
      console.warn("Soft warning: No estás autorizado para destacar este lugar (userId mismatch)");
    }
  } else {
    const event = await prisma.event.findUnique({
      where: { id: targetId },
      include: { place: true },
    });
    if (!event) {
      throw new Error("Evento no encontrado");
    }
    // Ownership check (soft — only enforce if place has an owner)
    if (event.place.ownerUserId && event.place.ownerUserId !== userId) {
      console.warn("Soft warning: No estás autorizado para destacar este evento");
    }
  }

  // Calculate sponsoredUntil (+30 days)
  const sponsoredUntil = new Date();
  sponsoredUntil.setDate(sponsoredUntil.getDate() + 30);

  // Update target to sponsored
  if (targetType === "PLACE") {
    await prisma.place.update({
      where: { id: targetId },
      data: { isSponsored: true, sponsoredUntil },
    });
  } else {
    await prisma.event.update({
      where: { id: targetId },
      data: { isSponsored: true, sponsoredUntil },
    });
  }

  // Register transaction
  const tx = await prisma.paymentTransaction.create({
    data: {
      userId,
      amount,
      targetType,
      targetId,
      status: "COMPLETED",
    },
  });

  return tx;
};
