import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createProductDto } from './dto/create_product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: createProductDto) {
    return this.prisma.product.create({
      data,
    });
  }

  async getAllProducts(
    category?: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const skip = (page - 1) * pageSize;

    return this.prisma.product.findMany({
      where: {
        category: category ? category : undefined,
      },
      skip,
      take: Number(pageSize),
    });
  }
}
