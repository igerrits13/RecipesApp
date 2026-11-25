import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../constants/pagination.constants.js";

// Get query information for what recipes to send
export function getPagination(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(
    Number(query.limit) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
