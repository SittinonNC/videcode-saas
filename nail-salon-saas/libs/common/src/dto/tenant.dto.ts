import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '../enums';

// ============================================
// TENANT DTOs
// ============================================

export class CreateTenantDto {
  @ApiProperty({ example: 'Beautiful Nails Salon' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'beautiful-nails', description: 'Unique subdomain for the shop' })
  @IsString()
  subdomain: string;

  @ApiProperty({ example: 'owner@beautifulnails.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+66812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Bangkok' })
  @IsOptional()
  @IsString()
  address?: string;

  // Owner account info (created during tenant registration)
  @ApiProperty({ example: 'owner@beautifulnails.com' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  ownerPassword: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  ownerFirstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  ownerLastName: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Beautiful Nails Pro' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'contact@beautifulnails.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+66812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '456 New Street, Bangkok' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  subdomain: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  logoUrl?: string;

  @ApiProperty({ enum: SubscriptionPlan })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty()
  isActive: boolean;
}
