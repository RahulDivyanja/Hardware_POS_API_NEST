import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { createSaleDto } from './dto/create-sale.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  create(@Body() dto: createSaleDto) {
    return this.salesService.createSale(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales (filterable by date range)' })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  @ApiResponse({ status: 200, description: 'List of sales' })
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.salesService.findAllSale(from, to);
  }
}
