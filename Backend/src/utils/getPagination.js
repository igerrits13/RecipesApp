// Get query information for what recipes to send
export function getPagination(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 10, 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
