export type Status = 'idle' | 'loading' | 'success' | 'error';

export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AuditLog extends BaseEntity {
  adminId: string;
  adminEmail: string;
  action: string;
  targetCollection: string;
  targetId?: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface WebsiteSettings extends BaseEntity {
  siteTitle: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  allowTeacherRegistration: boolean;
  featuredNotice?: string;
}

