// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "STAFF" | "CUSTOMER";
  tenantId: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  lineUserId?: string;
  subscriptionPlan: "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "PAST_DUE" | "CANCELED";
  subscriptionStartAt?: string;
  subscriptionEndAt?: string;
}

// Staff types
export interface Staff {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service types
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Customer types
export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking types
export interface Booking {
  id: string;
  tenantId: string;
  bookingNumber: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  cancelReason?: string;
  customer: Pick<Customer, "id" | "firstName" | "lastName" | "phone">;
  staff: Pick<Staff, "id" | "firstName" | "lastName" | "nickname">;
  services: BookingService[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface BookingService {
  id: string;
  service: Pick<Service, "id" | "name" | "price" | "durationMinutes">;
  quantity: number;
  price: number;
}

// Payment types
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod: "BANK_TRANSFER" | "PROMPTPAY" | "CREDIT_CARD";
  paidAt?: string;
}

// Bank info for payment page
export interface BankInfo {
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  amount: number;
  bookingNumber: string;
}

// Subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}
