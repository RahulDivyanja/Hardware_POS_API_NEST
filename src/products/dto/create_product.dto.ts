import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class createProductDto {
  @ApiProperty({ example: 'Hammer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HMR-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 29.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ example: 'Tools' })
  @IsString()
  @IsNotEmpty()
  category: string;
}
