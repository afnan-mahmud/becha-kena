// Standard API Response types per API contract

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: string;
  code: string;
  details?: string[];
}

export type ApiErrorResponse = ApiErrorBody;

export interface PaginatedData<T> {
  items?: T[];
  listings?: T[];
  reports?: T[];
  total: number;
  page: number;
  totalPages: number;
}
