/**
 * Message patterns for inter-service communication.
 * Using a centralized constants file ensures consistency across services.
 */

// Auth Service Patterns
export const AUTH_PATTERNS = {
  REGISTER: 'auth.register',
  LOGIN: 'auth.login',
  VALIDATE_TOKEN: 'auth.validate_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  RESET_PASSWORD: 'auth.reset_password',
  CHANGE_PASSWORD: 'auth.change_password',
} as const;

// Tenant Patterns
export const TENANT_PATTERNS = {
  CREATE: 'tenant.create',
  GET_BY_ID: 'tenant.get_by_id',
  GET_BY_SUBDOMAIN: 'tenant.get_by_subdomain',
  UPDATE: 'tenant.update',
  UPDATE_BY_SUBDOMAIN: 'tenant.update_by_subdomain',
  UPDATE_SUBSCRIPTION: 'tenant.update_subscription',
} as const;

// User Patterns
export const USER_PATTERNS = {
  CREATE: 'user.create',
  GET_BY_ID: 'user.get_by_id',
  GET_BY_EMAIL: 'user.get_by_email',
  UPDATE: 'user.update',
  LIST: 'user.list',
} as const;

// Staff Patterns
export const STAFF_PATTERNS = {
  CREATE: 'staff.create',
  GET_BY_ID: 'staff.get_by_id',
  UPDATE: 'staff.update',
  DELETE: 'staff.delete',
  LIST: 'staff.list',
  GET_AVAILABILITY: 'staff.get_availability',
} as const;

// Service (Menu) Patterns
export const SERVICE_PATTERNS = {
  CREATE: 'service.create',
  GET_BY_ID: 'service.get_by_id',
  UPDATE: 'service.update',
  DELETE: 'service.delete',
  LIST: 'service.list',
  GET_BY_CATEGORY: 'service.get_by_category',
} as const;

// Customer Patterns
export const CUSTOMER_PATTERNS = {
  CREATE: 'customer.create',
  GET_BY_ID: 'customer.get_by_id',
  GET_BY_PHONE: 'customer.get_by_phone',
  UPDATE: 'customer.update',
  DELETE: 'customer.delete',
  LIST: 'customer.list',
  SEARCH: 'customer.search',
} as const;

// Booking Patterns
export const BOOKING_PATTERNS = {
  CREATE: 'booking.create',
  GET_BY_ID: 'booking.get_by_id',
  UPDATE: 'booking.update',
  CANCEL: 'booking.cancel',
  LIST: 'booking.list',
  CHECK_AVAILABILITY: 'booking.check_availability',
  GET_BY_DATE_RANGE: 'booking.get_by_date_range',
  GET_BY_STAFF: 'booking.get_by_staff',
  GET_BY_CUSTOMER: 'booking.get_by_customer',
} as const;

// Payment Patterns
export const PAYMENT_PATTERNS = {
  CREATE_BOOKING_PAYMENT: 'payment.create_booking_payment',
  CREATE_PLATFORM_PAYMENT: 'payment.create_platform_payment',
  GET_PAYMENT_STATUS: 'payment.get_status',
  HANDLE_WEBHOOK: 'payment.handle_webhook',
  GENERATE_QR: 'payment.generate_qr',
  PROCESS_REFUND: 'payment.process_refund',
  VERIFY_SLIP: 'payment.verify_slip',
  GET_BANK_INFO: 'payment.get_bank_info',
  VERIFY_PLATFORM_PAYMENT: 'payment.verify_platform_payment',
} as const;

// Combine all patterns for easy access
export const MESSAGE_PATTERNS = {
  AUTH: AUTH_PATTERNS,
  TENANT: TENANT_PATTERNS,
  USER: USER_PATTERNS,
  STAFF: STAFF_PATTERNS,
  SERVICE: SERVICE_PATTERNS,
  CUSTOMER: CUSTOMER_PATTERNS,
  BOOKING: BOOKING_PATTERNS,
  PAYMENT: PAYMENT_PATTERNS,
} as const;
