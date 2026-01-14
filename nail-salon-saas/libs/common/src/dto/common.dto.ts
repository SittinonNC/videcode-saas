import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// SHARED / COMMON DTOs
// ============================================

/**
 * Pagination query parameters
 */
export class PaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * Standard pagination meta response
 */
export class PaginationMetaDto {
  @ApiPropertyOptional()
  total: number;

  @ApiPropertyOptional()
  page: number;

  @ApiPropertyOptional()
  limit: number;

  @ApiPropertyOptional()
  totalPages: number;
}

/**
 * Standard success response wrapper
 */
export class SuccessResponseDto<T> {
  success: boolean = true;
  data: T;
  meta?: PaginationMetaDto;
}

/**
 * Standard error response
 */
export class ErrorResponseDto {
  success: boolean = false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
