import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// CUSTOMER DTOs
// ============================================

export class CreateCustomerDto {
  @ApiProperty({ example: 'Emily' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Chen' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'emily@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+66891234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Prefers gel polish. Allergic to acetone.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Emily' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Chen' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'emily.new@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+66891234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Updated preferences.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  totalVisits: number;

  @ApiProperty()
  totalSpent: number;

  @ApiPropertyOptional()
  lastVisitAt?: Date;
}

export class SearchCustomerDto {
  @ApiPropertyOptional({ example: 'Emily', description: 'Search by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+66891234567', description: 'Search by phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'emily@example.com', description: 'Search by email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
