import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrismaService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    const createDto = {
      name: 'Hammer',
      sku: 'HMR-001',
      price: 25.99,
      stockQuantity: 100,
      category: 'Tools',
    };

    it('should create a product with the given data', async () => {
      const createdProduct = { id: 1, ...createDto };
      prisma.product.create.mockResolvedValue(createdProduct);

      const result = await service.createProduct(createDto);

      expect(prisma.product.create).toHaveBeenCalledWith({ data: createDto });
      expect(result).toEqual(createdProduct);
    });
  });

  describe('getAllProducts', () => {
    const products = [
      { id: 1, name: 'Hammer', sku: 'HMR-001', price: 25.99, stockQuantity: 100, category: 'Tools' },
      { id: 2, name: 'Screwdriver', sku: 'SCR-001', price: 12.5, stockQuantity: 200, category: 'Tools' },
    ];

    it('should return all products with default pagination', async () => {
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service.getAllProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { category: undefined },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(products);
    });

    it('should filter products by category', async () => {
      prisma.product.findMany.mockResolvedValue(products);

      await service.getAllProducts('Tools');

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { category: 'Tools' },
        skip: 0,
        take: 10,
      });
    });

    it('should apply pagination correctly', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getAllProducts(undefined, 3, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { category: undefined },
        skip: 10,
        take: 5,
      });
    });

    it('should handle category filter with custom pagination', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getAllProducts('Electrical', 2, 20);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { category: 'Electrical' },
        skip: 20,
        take: 20,
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const product = { id: 1, name: 'Hammer', sku: 'HMR-001', price: 25.99, stockQuantity: 100, category: 'Tools' };
      prisma.product.findUnique.mockResolvedValue(product);

      const result = await service.getProductById(1);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(product);
    });

    it('should return null if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await service.getProductById(999);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    const updateDto = {
      name: 'Updated Hammer',
      sku: 'HMR-001',
      price: 29.99,
      stockQuantity: 80,
      category: 'Tools',
    };

    it('should update a product by id with the given data', async () => {
      const updatedProduct = { id: 1, ...updateDto };
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(1, updateDto);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product by id', async () => {
      const deletedProduct = { id: 1, name: 'Hammer', sku: 'HMR-001', price: 25.99, stockQuantity: 100, category: 'Tools' };
      prisma.product.delete.mockResolvedValue(deletedProduct);

      const result = await service.deleteProduct(1);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(deletedProduct);
    });
  });
});
