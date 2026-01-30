# Nail Salon SaaS Platform

A production-ready **B2B2C SaaS platform** for nail salons built with NestJS Microservices architecture.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐
│   Frontend      │──────│   API Gateway    │
│   (Any Stack)   │ HTTP │   (port 3000)    │
└─────────────────┘      └────────┬─────────┘
                                  │ Redis Transport
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │ Core Service  │   │Booking Service│   │Payment Service│
│ • Login       │   │ • Staff       │   │ • Scheduling  │   │ • GB Prime Pay│
│ • Register    │   │ • Services    │   │ • Conflicts   │   │ • Subscriptions│
│ • Tenants     │   │ • Customers   │   │ • Availability│   │ • Webhooks    │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │                   │
        └───────────────────┴───────────────────┴───────────────────┘
                                    │
                             ┌──────┴──────┐
                             │  PostgreSQL │
                             └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### 1. Clone & Install

```bash
cd nail-salon-saas
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Start Services (Development)

```bash
# Option 1: Start all services at once
npm run start:all

# Option 2: Start individually (in separate terminals)
npm run start:dev api-gateway
npm run start:dev auth-service
npm run start:dev core-service
npm run start:dev booking-service
npm run start:dev payment-service
```

### 5. Access the API

- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

## 📁 Project Structure

```
nail-salon-saas/
├── apps/
│   ├── api-gateway/          # HTTP REST entry point
│   ├── auth-service/         # Authentication & tenants
│   ├── core-service/         # Staff, services, customers
│   ├── booking-service/      # Appointment scheduling
│   └── payment-service/      # Payment processing
├── libs/
│   └── common/               # Shared code
│       ├── database/         # Prisma service
│       ├── decorators/       # @CurrentUser, @CurrentTenant
│       ├── dto/              # Shared DTOs
│       ├── filters/          # Exception filters
│       └── interfaces/       # Type definitions
├── prisma/
│   └── schema.prisma         # Database schema
├── docker-compose.yml
└── package.json
```

## 🏢 Multi-Tenancy

This platform uses **subdomain-based multi-tenancy**:

```
https://beautiful-nails.yourdomain.com/api/v1/...
https://nail-paradise.yourdomain.com/api/v1/...
```

For local development, use the `X-Tenant-Subdomain` header:

```bash
curl -H "X-Tenant-Subdomain: beautiful-nails" http://localhost:3000/api/v1/services
```

Every query in the system **MUST** filter by `tenant_id` to ensure data isolation.

## 🔐 Authentication

1. Register a new tenant (shop):

```bash
POST /api/v1/auth/register-tenant
{
  "name": "Beautiful Nails Salon",
  "subdomain": "beautiful-nails",
  "email": "shop@example.com",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "SecureP@ss123",
  "ownerFirstName": "Jane",
  "ownerLastName": "Doe"
}
```

2. Login:

```bash
POST /api/v1/auth/login
{
  "email": "owner@example.com",
  "password": "SecureP@ss123"
}
```

3. Use the JWT token:

```bash
Authorization: Bearer <token>
```

## 📝 API Endpoints

| Service   | Endpoint                     | Description        |
| --------- | ---------------------------- | ------------------ |
| Auth      | `POST /auth/login`           | User login         |
| Auth      | `POST /auth/register`        | Register user      |
| Auth      | `POST /auth/register-tenant` | Register new shop  |
| Staff     | `GET /staff`                 | List staff         |
| Staff     | `POST /staff`                | Create staff       |
| Services  | `GET /services`              | List service menu  |
| Services  | `POST /services`             | Create service     |
| Customers | `GET /customers`             | List customers     |
| Customers | `POST /customers`            | Create customer    |
| Bookings  | `POST /bookings`             | Create booking     |
| Bookings  | `GET /bookings/availability` | Check availability |
| Payments  | `POST /payments/booking`     | Create payment     |

See full documentation at `/api/docs`.

## 🐳 Docker Production Deployment

```bash
# Build all services
docker-compose build

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f api-gateway
```

## 🔧 Development Commands

```bash
# Prisma
npm run prisma:generate    # Generate client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio

# Testing
npm run test               # Unit tests
npm run test:e2e           # E2E tests

# Linting
npm run lint               # ESLint
npm run format             # Prettier
```

## 💳 Payment Integration

Payment is integrated with **GB Prime Pay**. Configure in `.env`:

```env
GBPRIMEPAY_PUBLIC_KEY=your-public-key
GBPRIMEPAY_SECRET_KEY=your-secret-key
GBPRIMEPAY_WEBHOOK_SECRET=your-webhook-secret
```

Webhook URL: `https://yourdomain.com/api/v1/payments/webhook/gbprimepay`

## 📄 License

UNLICENSED - Proprietary
