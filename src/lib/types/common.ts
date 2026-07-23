// FR8X-CON Common Types
// Shared types used across the entire application

export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export type AuditFields = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  version: number;
  isDeleted?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  lastDoc?: string;
};

export type SortDirection = "asc" | "desc";

export type SortConfig = {
  field: string;
  direction: SortDirection;
};

export type FilterConfig = {
  field: string;
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";
  value: unknown;
};

export type Status = "active" | "inactive" | "pending" | "archived" | "deleted";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type TabConfig = {
  id: string;
  label: string;
  icon?: string;
  count?: number;
};
