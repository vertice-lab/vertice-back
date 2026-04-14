import { PaginationMeta } from '../helpers/pagination.helper';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
