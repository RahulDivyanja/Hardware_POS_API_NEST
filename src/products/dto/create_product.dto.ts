import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class createProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @IsString()
  @IsNotEmpty()
  category: string;
}
