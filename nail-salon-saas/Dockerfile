# ===========================================
# Multi-stage Dockerfile for NestJS Monorepo
# ===========================================

# Base stage with Node.js
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

# Build stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:all
RUN npx prisma generate

# ===========================================
# Service-specific stages
# ===========================================

# API Gateway
FROM base AS api-gateway
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/api-gateway ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]

# Auth Service
FROM base AS auth-service
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/auth-service ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
CMD ["node", "dist/main.js"]

# Core Service
FROM base AS core-service
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/core-service ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
CMD ["node", "dist/main.js"]

# Booking Service
FROM base AS booking-service
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/booking-service ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
CMD ["node", "dist/main.js"]

# Payment Service
FROM base AS payment-service
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/payment-service ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
CMD ["node", "dist/main.js"]
