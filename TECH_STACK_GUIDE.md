# 📚 Nail Salon SaaS - Tech Stack & Architecture Guide

## 🏗️ Project Overview

โปรเจคนี้เป็น **B2B2C SaaS Platform** สำหรับร้านทำเล็บ โดยมี 2 ฝั่งหลัก:

1. **B2B (Business to Business)**: เจ้าของร้านสมัครใช้ระบบ จ่ายค่าบริการรายเดือน (Subscription)
2. **B2C (Business to Consumer)**: ลูกค้าจองคิวผ่านหน้า public และจ่ายเงินให้ร้าน

---

## 🗂️ Repository Structure

```
BEsaas/
├── nail-salon-saas/          # Backend (NestJS Microservices)
│   ├── apps/
│   │   ├── api-gateway/      # API Gateway (HTTP entry point)
│   │   ├── auth-service/     # Authentication microservice
│   │   ├── core-service/     # Business logic (Staff, Service, Customer)
│   │   ├── booking-service/  # Booking management
│   │   └── payment-service/  # Payment processing
│   ├── libs/common/          # Shared DTOs, decorators, utilities
│   └── prisma/               # Database schema & migrations
│
└── nail-salon-frontend/      # Frontend (Next.js)
    └── src/
        ├── app/              # Next.js App Router pages
        ├── components/       # Reusable UI components
        ├── hooks/            # Custom React hooks
        ├── services/         # API client services
        ├── stores/           # Zustand state stores
        └── types/            # TypeScript type definitions
```

---

## 🛠️ Backend Tech Stack

### Core Framework: **NestJS** (v10)

> Node.js framework สำหรับสร้าง scalable server-side applications

| Component                               | Description                         |
| --------------------------------------- | ----------------------------------- |
| `@nestjs/microservices`                 | สร้าง Microservices architecture    |
| `@nestjs/swagger`                       | Auto-generate API documentation     |
| `@nestjs/passport` + `@nestjs/jwt`      | JWT Authentication                  |
| `class-validator` + `class-transformer` | Request validation & transformation |

### Database: **PostgreSQL** + **Prisma ORM**

> Prisma เป็น Type-safe ORM ที่ generate TypeScript types จาก schema

```prisma
// ตัวอย่าง Multi-tenant design
model Booking {
  id        String @id @default(uuid())
  tenantId  String  // ทุก table มี tenantId
  ...
}
```

### Message Broker: **Redis**

> ใช้สำหรับ Inter-service communication ผ่าน Redis Transport

```
┌────────────────┐     Redis      ┌─────────────────┐
│  API Gateway   │ ─────────────► │  Auth Service   │
│  (Port 8080)   │                │  Core Service   │
│                │                │  Booking Service│
│                │                │  Payment Service│
└────────────────┘                └─────────────────┘
```

---

## 📦 Backend Microservices

### 1. API Gateway (`apps/api-gateway`)

**Port:** 8080

| Feature                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| **HTTP Entry Point**   | รับ request จาก Frontend                       |
| **JWT Authentication** | Validate token ก่อนส่งต่อ                      |
| **Tenant Resolution**  | ดึง `tenantId` จาก header `X-Tenant-Subdomain` |
| **Request Routing**    | ส่ง request ไปยัง microservice ที่เหมาะสม      |

```typescript
// ตัวอย่าง: Forward request ไป Booking Service
@Post()
async createBooking(@Body() dto: CreateBookingDto) {
  return this.bookingClient.send(BOOKING_PATTERNS.CREATE, payload);
}
```

---

### 2. Auth Service (`apps/auth-service`)

**Features:**

- ✅ User Registration (พร้อมสร้าง Tenant)
- ✅ Login / Logout
- ✅ JWT Token Generation & Validation
- ✅ Password Hashing (bcrypt)

```typescript
// JWT Payload structure
interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: UserRole;
}
```

---

### 3. Core Service (`apps/core-service`)

**Manages:**

- 👨‍💼 **Staff** - ข้อมูลช่างทำเล็บ
- 💅 **Services** - รายการบริการ (ทำสีเจล, สปาเล็บ, etc.)
- 👤 **Customers** - ข้อมูลลูกค้า

---

### 4. Booking Service (`apps/booking-service`)

**Features:**

- 📅 Create/Update/Cancel Bookings
- ⏰ Staff Availability Check
- 📊 Booking Status Management

**Booking Status Flow:**

```
PENDING → CONFIRMED → IN_SERVICE → COMPLETED
            ↓
         CANCELLED
```

---

### 5. Payment Service (`apps/payment-service`)

**Most Complex Service - Handles 2 Payment Types:**

#### A. B2B Subscription Payments (Stripe)

เจ้าของร้านจ่ายค่าบริการรายเดือนให้ Platform

```typescript
// stripe.service.ts
class StripeService {
  createCheckoutSession(); // สร้าง Checkout URL
  createPortalSession(); // จัดการ subscription
  handleWebhook(); // รับ event จาก Stripe
}
```

**Flow:**

```
1. เจ้าของร้านกด "Subscribe"
2. Redirect ไป Stripe Checkout
3. จ่ายเงินสำเร็จ → Stripe Webhook
4. Update Tenant subscription status
```

---

#### B. B2C Booking Payments (Bank Transfer + SlipOK)

ลูกค้าจ่ายเงินค่าบริการให้ร้าน

```typescript
// slipok.service.ts
class SlipOkService {
  verifySlip(imageBuffer); // ส่งรูป slip ไป SlipOK API
  validateSlipData(data, amount); // ตรวจสอบยอด/ผู้รับ
}
```

**Flow:**

```
1. ลูกค้าสร้าง Booking → ได้เลข booking
2. ไปหน้าชำระเงิน → เห็นเลขบัญชีร้าน
3. โอนเงิน → ได้ Slip
4. อัพโหลด Slip → SlipOK ตรวจสอบ
5. ถ้าถูกต้อง → Booking status = CONFIRMED
6. LINE แจ้งเตือนเจ้าของร้าน
```

---

#### C. LINE Messaging Integration

```typescript
// line-notify.service.ts
class LineMessagingService {
  sendTextMessage(userId, text); // ส่งข้อความหาเจ้าของร้าน
  sendPaymentNotification(); // แจ้งรับเงินจากลูกค้า
  sendBookingConfirmation(); // แจ้ง booking ใหม่
}
```

---

## 🎨 Frontend Tech Stack

### Core: **Next.js 16** (App Router)

> React framework ที่มี SSR, routing, และ API routes built-in

### State Management: **Zustand**

```typescript
// stores/auth.store.ts
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

### Data Fetching: **TanStack Query (React Query)**

```typescript
// hooks/use-services.ts
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => serviceService.getServices(),
  });
}
```

### Form Management: **React Hook Form + Zod**

```typescript
// schemas/booking-schema.ts
const bookingSchema = z.object({
  staffId: z.string().uuid(),
  startTime: z.string().datetime(),
  services: z.array(z.object({ serviceId: z.string() })),
});
```

### UI Components: **Radix UI + Tailwind CSS**

- Radix UI: Accessible, unstyled components
- Tailwind CSS v4: Utility-first CSS framework
- CVA (Class Variance Authority): Component variants

### Other Libraries:

| Library        | Purpose             |
| -------------- | ------------------- |
| `lucide-react` | Icons               |
| `sonner`       | Toast notifications |
| `axios`        | HTTP client         |
| `js-cookie`    | Cookie management   |

---

## 🔐 Authentication Flow

```
┌─────────────┐     POST /auth/login    ┌─────────────┐
│   Frontend  │ ─────────────────────► │ Auth Service │
│             │                         │              │
│             │ ◄───────────────────── │              │
└─────────────┘    { token, user }      └─────────────┘
       │
       │ Store token in Cookie + Zustand
       ▼
┌─────────────┐    Authorization: Bearer {token}
│   Frontend  │ ────────────────────────────────────►
│             │         X-Tenant-Subdomain: loveay
└─────────────┘
```

---

## 👥 User Roles

| Role      | Permissions                                  |
| --------- | -------------------------------------------- |
| `OWNER`   | Full access (settings, subscription, delete) |
| `MANAGER` | Manage staff, services, view reports         |
| `STAFF`   | Create bookings, manage own schedule         |

---

## 🌐 Multi-Tenant Architecture

ทุก request ต้องมี `tenantId` โดย:

1. **Authenticated Request:** ดึงจาก JWT token
2. **Public Request:** ดึงจาก `X-Tenant-Subdomain` header

```typescript
// middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware {
  async use(req, res, next) {
    const subdomain = req.headers["x-tenant-subdomain"];
    const tenant = await this.findTenantBySubdomain(subdomain);
    req.tenantId = tenant.id;
    next();
  }
}
```

---

## 💳 Payment Integration Summary

### Stripe (B2B Platform Fees)

| Config      | Value                                    |
| ----------- | ---------------------------------------- |
| Environment | `.env` → `STRIPE_SECRET_KEY`             |
| Webhook     | `/api/v1/payments/webhook/stripe`        |
| Plans       | BASIC (฿299), PRO (฿599), PREMIUM (฿999) |

### SlipOK (B2C Bank Transfer)

| Config      | Value                                               |
| ----------- | --------------------------------------------------- |
| Environment | `.env` → `SLIPOK_API_KEY`, `SLIPOK_BRANCH_ID`       |
| API         | `https://api.slipok.com/api/line/apikey/{branchId}` |
| Features    | QR code reading, duplicate detection                |

### LINE Messaging API

| Config      | Value                                     |
| ----------- | ----------------------------------------- |
| Environment | `.env` → `LINE_CHANNEL_ACCESS_TOKEN`      |
| API         | `https://api.line.me/v2/bot/message/push` |
| Use Cases   | Payment notifications, booking alerts     |

---

## 📱 Frontend Routes

### Public Routes (ไม่ต้อง Login)

| Route              | Description         |
| ------------------ | ------------------- |
| `/`                | Landing page        |
| `/login`           | Login page          |
| `/register`        | Register new tenant |
| `/book/:subdomain` | Public booking page |
| `/pay/:bookingId`  | Payment page        |

### Protected Routes (ต้อง Login)

| Route                  | Description         |
| ---------------------- | ------------------- |
| `/dashboard`           | Dashboard overview  |
| `/dashboard/bookings`  | Booking management  |
| `/dashboard/services`  | Service management  |
| `/dashboard/staff`     | Staff management    |
| `/dashboard/customers` | Customer management |
| `/dashboard/settings`  | Shop settings       |
| `/subscription`        | Subscription plans  |

---

## 🔄 Complete Booking Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    PUBLIC BOOKING FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. ลูกค้าเข้า /book/loveay                                   │
│     ↓                                                         │
│  2. เลือก Service + Staff + เวลา                              │
│     ↓                                                         │
│  3. กรอกชื่อ + เบอร์ → POST /bookings/public                   │
│     ↓                                                         │
│  4. Backend:                                                   │
│     • เช็ค Customer by phone → ไม่มี? สร้างใหม่               │
│     • สร้าง Booking (status: PENDING)                         │
│     ↓                                                         │
│  5. Redirect ไป /pay/{bookingNumber}                          │
│     ↓                                                         │
│  6. แสดงข้อมูลบัญชีธนาคารของร้าน                              │
│     ↓                                                         │
│  7. ลูกค้าโอนเงิน + อัพโหลด Slip                               │
│     ↓                                                         │
│  8. Backend:                                                   │
│     • SlipOK ตรวจสอบ Slip                                     │
│     • ตรวจ amount + receiver                                  │
│     • สร้าง BookingPayment record                             │
│     • Update Booking status → CONFIRMED                       │
│     • LINE แจ้งเตือนเจ้าของร้าน                               │
│     ↓                                                         │
│  9. ลูกค้าได้รับแจ้งว่าจองสำเร็จ ✅                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running the Project

### Backend

```bash
cd nail-salon-saas

# Start PostgreSQL + Redis (Docker)
docker-compose up -d

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start all microservices
npm run dev
```

### Frontend

```bash
cd nail-salon-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📋 Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nail_salon"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# SlipOK
SLIPOK_API_KEY=your-api-key
SLIPOK_BRANCH_ID=your-branch-id

# LINE
LINE_CHANNEL_ACCESS_TOKEN=your-channel-token

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 📊 Database Schema Overview

```
┌─────────┐       ┌─────────┐       ┌──────────┐
│ Tenant  │──────►│  User   │       │  Staff   │
└────┬────┘       └─────────┘       └────┬─────┘
     │                                    │
     │            ┌──────────┐            │
     └───────────►│ Customer │◄───────────┘
                  └────┬─────┘            │
                       │                  │
                  ┌────▼─────┐            │
                  │ Booking  │◄───────────┘
                  └────┬─────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌───────────┐ ┌──────────────┐
    │ Booking  │ │  Booking  │ │   Platform   │
    │ Service  │ │  Payment  │ │   Payment    │
    └──────────┘ └───────────┘ └──────────────┘
```

---

## ✅ Summary

| Layer             | Technology               | Purpose                   |
| ----------------- | ------------------------ | ------------------------- |
| **Frontend**      | Next.js 16 + React 19    | UI & User Experience      |
| **State**         | Zustand + TanStack Query | State & Cache Management  |
| **API Gateway**   | NestJS                   | Request routing & Auth    |
| **Microservices** | NestJS + Redis           | Business logic separation |
| **Database**      | PostgreSQL + Prisma      | Data persistence          |
| **B2B Payments**  | Stripe                   | Subscription billing      |
| **B2C Payments**  | Bank Transfer + SlipOK   | Customer payments         |
| **Notifications** | LINE Messaging API       | Shop owner alerts         |

---

> 📅 Last Updated: 2026-01-15
