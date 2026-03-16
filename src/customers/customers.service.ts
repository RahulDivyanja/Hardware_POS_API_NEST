import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  //   Create Customer
  async createCustomer(createCustomerDto: createCustomerDto) {
    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  //   Get Customer by ID
  async getCustomer(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }
  //  Get All Customers with pagination
  async getAllCustomers(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const allCoustomers = await this.prisma.customer.findMany({
      skip,
      take: Number(pageSize),
      orderBy: { id: 'desc' },
    });
    if (allCoustomers.length === 0) {
      throw new NotFoundException('No customers found');
    }
    return allCoustomers;
  }
}
