import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// SERVICE (MENU) DTOs
// ============================================

export class CreateServiceDto {
  @ApiProperty({ example: 'Gel Manicure' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Professional gel manicure with long-lasting finish' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Manicure' })
  @IsString()
  category: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({ example: 599.0, description: 'Price in THB' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/service.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display order for sorting' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Gel Manicure Deluxe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Premium gel manicure with nail art' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Manicure' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 799.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 'https://example.com/updated-service.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isActive: boolean;
}
