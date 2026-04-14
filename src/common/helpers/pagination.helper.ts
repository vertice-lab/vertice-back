export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages - 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  };
}
