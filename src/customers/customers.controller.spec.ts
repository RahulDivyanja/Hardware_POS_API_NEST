import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { NotFoundException } from '@nestjs/common';

const mockCustomersService = {
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  getAllCustomers: jest.fn(),
};

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: typeof mockCustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get(CustomersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCustomer', () => {
    const createDto = { name: 'John Doe', phone: '1234567890' };

    it('should create and return a customer', async () => {
      const createdCustomer = { id: 1, ...createDto };
      service.createCustomer.mockResolvedValue(createdCustomer);

      const result = await controller.createCustomer(createDto);

      expect(service.createCustomer).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdCustomer);
    });

    it('should create a customer without phone', async () => {
      const dtoWithoutPhone = { name: 'Jane Doe' };
      const createdCustomer = { id: 2, name: 'Jane Doe', phone: null };
      service.createCustomer.mockResolvedValue(createdCustomer);

      const result = await controller.createCustomer(dtoWithoutPhone as any);

      expect(service.createCustomer).toHaveBeenCalledWith(dtoWithoutPhone);
      expect(result).toEqual(createdCustomer);
    });
  });

  describe('getCustomer', () => {
    it('should return a customer by id', async () => {
      const customer = { id: 1, name: 'John Doe', phone: '1234567890' };
      service.getCustomer.mockResolvedValue(customer);

      const result = await controller.getCustomer(1);

      expect(service.getCustomer).toHaveBeenCalledWith(1);
      expect(result).toEqual(customer);
    });

    it('should propagate NotFoundException from service', async () => {
      service.getCustomer.mockRejectedValue(
        new NotFoundException('Customer with ID 999 not found'),
      );

      await expect(controller.getCustomer(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getCustomer(999)).rejects.toThrow(
        'Customer with ID 999 not found',
      );
    });
  });

  describe('getAllCustomers', () => {
    const customers = [
      { id: 2, name: 'Jane Doe', phone: null },
      { id: 1, name: 'John Doe', phone: '1234567890' },
    ];

    it('should return all customers with default pagination', async () => {
      service.getAllCustomers.mockResolvedValue(customers);

      const result = await controller.getAllCustomers();

      expect(service.getAllCustomers).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(customers);
    });

    it('should pass page and pageSize to service', async () => {
      service.getAllCustomers.mockResolvedValue([]);

      await controller.getAllCustomers(2, 5);

      expect(service.getAllCustomers).toHaveBeenCalledWith(2, 5);
    });

    it('should return empty array when no customers exist', async () => {
      service.getAllCustomers.mockResolvedValue([]);

      const result = await controller.getAllCustomers();

      expect(result).toEqual([]);
    });
  });
});
