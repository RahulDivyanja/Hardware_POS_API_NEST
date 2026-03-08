import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class saleItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class createSaleDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  cashierName: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  customerId?: number;

  @ApiProperty({ type: [saleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => saleItemDto)
  items: saleItemDto[];
}
