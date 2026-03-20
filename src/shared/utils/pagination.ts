export const getPagination = (page = 1, pageSize = 10) => {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 100);
  const skip = (safePage - 1) * safeSize;
  return { skip, take: safeSize, page: safePage, pageSize: safeSize };
};

