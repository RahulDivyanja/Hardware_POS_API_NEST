import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

// Transaction proxy that mirrors the prisma client methods used inside the transaction
const mockTx = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  sale: {
    create: jest.fn(),
  },
};

const mockPrismaService = {
  // Execute the callback with our mockTx so we can assert against it
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx)),
  sale: {
    findMany: jest.fn(),
  },
};

describe('SalesService', () => {
  let service: SalesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    // Re-assign $transaction since clearAllMocks wipes the implementation
    prisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSale', () => {
    const saleDto = {
      cashierName: 'Alice',
      customerId: 1,
      items: [
        { productId: 10, quantity: 2 },
        { productId: 20, quantity: 1 },
      ],
    };

    const product10 = { id: 10, price: 50, stockQuantity: 10 };
    const product20 = { id: 20, price: 30, stockQuantity: 5 };

    it('should create a sale, decrement stock, and return sale with items', async () => {
      mockTx.product.findUnique
        .mockResolvedValueOnce(product10)
        .mockResolvedValueOnce(product20);
      mockTx.product.update.mockResolvedValue({});

      const expectedSale = {
        id: 1,
        cashierName: 'Alice',
        customerId: 1,
        totalAmount: 130, // 50*2 + 30*1
        items: [
          { productId: 10, quantity: 2, unitPrice: 50 },
          { productId: 20, quantity: 1, unitPrice: 30 },
        ],
      };
      mockTx.sale.create.mockResolvedValue(expectedSale);

      const result = await service.createSale(saleDto);

      // Verify stock decrements
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stockQuantity: { decrement: 2 } },
      });
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { stockQuantity: { decrement: 1 } },
      });

      // Verify sale creation
      expect(mockTx.sale.create).toHaveBeenCalledWith({
        data: {
          cashierName: 'Alice',
          customerId: 1,
          totalAmount: 130,
          items: {
            create: [
              { productId: 10, quantity: 2, unitPrice: 50 },
              { productId: 20, quantity: 1, unitPrice: 30 },
            ],
          },
        },
        include: { items: true },
      });

      expect(result).toEqual(expectedSale);
    });

    it('should throw an error if a product is not found', async () => {
      mockTx.product.findUnique.mockResolvedValue(null);

      await expect(service.createSale(saleDto)).rejects.toThrow(
        'Product with ID 10 not found',
      );
      expect(mockTx.product.update).not.toHaveBeenCalled();
      expect(mockTx.sale.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      const lowStockProduct = { id: 10, price: 50, stockQuantity: 1 };
      mockTx.product.findUnique.mockResolvedValue(lowStockProduct);

      await expect(service.createSale(saleDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.createSale({
          ...saleDto,
          items: [{ productId: 10, quantity: 2 }],
        }),
      ).rejects.toThrow('Insufficient stock for product ID 10');
    });

    it('should calculate totalAmount correctly from product prices', async () => {
      const singleItemDto = {
        cashierName: 'Bob',
        items: [{ productId: 10, quantity: 3 }],
      };
      const product = { id: 10, price: 15.5, stockQuantity: 10 };
      mockTx.product.findUnique.mockResolvedValue(product);
      mockTx.product.update.mockResolvedValue({});
      mockTx.sale.create.mockResolvedValue({});

      await service.createSale(singleItemDto);

      expect(mockTx.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 46.5, // 15.5 * 3
          }),
        }),
      );
    });

    it('should create a sale without customerId', async () => {
      const dtoNoCustomer = {
        cashierName: 'Bob',
        items: [{ productId: 10, quantity: 1 }],
      };
      mockTx.product.findUnique.mockResolvedValue(product10);
      mockTx.product.update.mockResolvedValue({});
      mockTx.sale.create.mockResolvedValue({});

      await service.createSale(dtoNoCustomer);

      expect(mockTx.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: undefined,
          }),
        }),
      );
    });

    it('should run all operations inside a transaction', async () => {
      mockTx.product.findUnique.mockResolvedValue(product10);
      mockTx.product.update.mockResolvedValue({});
      mockTx.sale.create.mockResolvedValue({});

      await service.createSale({
        cashierName: 'Alice',
        items: [{ productId: 10, quantity: 1 }],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllSale', () => {
    const sales = [
      { id: 1, cashierName: 'Alice', totalAmount: 100, items: [] },
      { id: 2, cashierName: 'Bob', totalAmount: 50, items: [] },
    ];

    it('should return all sales without date filter', async () => {
      prisma.sale.findMany.mockResolvedValue(sales);

      const result = await service.findAllSale();

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: undefined, lte: undefined },
        },
        include: { items: true },
      });
      expect(result).toEqual(sales);
    });

    it('should filter sales by from date', async () => {
      prisma.sale.findMany.mockResolvedValue([sales[1]]);

      const result = await service.findAllSale('2026-03-01');

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: new Date('2026-03-01'), lte: undefined },
        },
        include: { items: true },
      });
      expect(result).toEqual([sales[1]]);
    });

    it('should filter sales by to date', async () => {
      prisma.sale.findMany.mockResolvedValue([sales[0]]);

      await service.findAllSale(undefined, '2026-03-07');

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: undefined, lte: new Date('2026-03-07') },
        },
        include: { items: true },
      });
    });

    it('should filter sales by date range', async () => {
      prisma.sale.findMany.mockResolvedValue(sales);

      await service.findAllSale('2026-03-01', '2026-03-07');

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-07'),
          },
        },
        include: { items: true },
      });
    });

    it('should return empty array when no sales exist', async () => {
      prisma.sale.findMany.mockResolvedValue([]);

      const result = await service.findAllSale();

      expect(result).toEqual([]);
    });
  });
});
