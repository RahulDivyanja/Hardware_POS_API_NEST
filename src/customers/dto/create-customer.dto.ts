import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class createCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
