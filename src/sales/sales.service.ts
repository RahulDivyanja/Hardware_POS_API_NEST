import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(dto: createSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData: {
        productId: number;
        quantity: number;
        unitPrice: number;
      }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ID ${item.productId}`,
          );
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        totalAmount += product.price * item.quantity;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }
      return tx.sale.create({
        data: {
          cashierName: dto.cashierName,
          customerId: dto.customerId,
          totalAmount: totalAmount,
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      });
    });
  }

  async findAllSale(from?: string, to?: string) {
    return this.prisma.sale.findMany({
      where: {
        timestamp: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { items: true },
    });
  }
}
