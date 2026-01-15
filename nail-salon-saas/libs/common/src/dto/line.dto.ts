import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkLineUserDto {
  @ApiProperty({
    example: 'demo',
    description: 'Subdomain ของร้าน',
  })
  @IsString()
  subdomain: string;

  @ApiProperty({
    example: 'U6ac9b02864d0c0e12033c51105d4cc9e',
    description: 'LINE User ID',
  })
  @IsString()
  lineUserId: string;
}
