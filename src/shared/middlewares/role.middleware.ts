const normalizeRole = (role?: string) => {
  const value = (role || "").trim().toUpperCase();
  if (value === "MERCHANT") return "OWNER";
  return value;
};

export const authorize =
  (...roles: string[]) =>
  (req: any, res: any, next: any) => {
    const allowedRoles = roles.map(normalizeRole);
    const currentRole = normalizeRole(req.user?.role);

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        message: "No autorizado",
      });
    }

    next();
  };
