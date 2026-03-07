import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createProductDto } from './dto/create_product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Add Product
  async createProduct(data: createProductDto) {
    return this.prisma.product.create({
      data,
    });
  }

  // Get All Products with pagination and optional category filter
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

  // Get Product by ID
  async getProductById(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  // Update Product
  async updateProduct(id: number, data: createProductDto) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Delete Product
  async deleteProduct(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
