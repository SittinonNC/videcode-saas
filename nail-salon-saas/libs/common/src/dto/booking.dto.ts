import {
  IsString,
  IsArray,
  IsDateString,
  IsOptional,
  IsNumber,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus } from '../enums';

// ============================================
// BOOKING DTOs
// ============================================

export class BookingServiceItemDto {
  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  serviceId: string;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Staff ID who will perform the service' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ example: '2024-03-15T10:00:00Z', description: 'Booking start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ type: [BookingServiceItemDto], description: 'Services to book' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingServiceItemDto)
  services: BookingServiceItemDto[];

  @ApiPropertyOptional({ example: 'Customer prefers quiet environment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 50.0, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;
}

export class CreatePublicBookingDto {
  @ApiProperty({ example: 'Emily' })
  @IsString()
  customerFirstName: string;

  @ApiProperty({ example: 'Chen' })
  @IsString()
  customerLastName: string;

  @ApiProperty({ example: '+66891234567' })
  @IsString()
  customerPhone: string;

  @ApiPropertyOptional({ example: 'emily@example.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty({ description: 'Staff ID who will perform the service' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ example: '2024-03-15T10:00:00Z', description: 'Booking start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ type: [BookingServiceItemDto], description: 'Services to book' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingServiceItemDto)
  services: BookingServiceItemDto[];

  @ApiPropertyOptional({ example: 'Customer prefers quiet environment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Staff ID' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ example: '2024-03-15T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Customer requested cancellation' })
  @IsString()
  cancelReason: string;
}

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Staff ID to check availability for' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ example: '2024-03-15', description: 'Date to check' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes needed' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;
}

export class GetBookingsByDateRangeDto {
  @ApiProperty({ example: '2024-03-01', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2024-03-31', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by staff ID' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

export class BookingServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  duration: number;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookingNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  staffId: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  totalDuration: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [BookingServiceResponseDto] })
  services: BookingServiceResponseDto[];
}

export class TimeSlotDto {
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  endTime: string;

  @ApiProperty()
  available: boolean;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  staffId: string;

  @ApiProperty()
  date: string;

  @ApiProperty({ type: [TimeSlotDto] })
  slots: TimeSlotDto[];
}
