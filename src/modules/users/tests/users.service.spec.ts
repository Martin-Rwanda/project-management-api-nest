import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repositories/user.repository';
import { UsersService } from '../users.service';

const mockUser = {
  id: '1',
  email: 'john@example.com',
  password: 'hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'john@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', { firstName: 'Jane' });

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', {
        firstName: 'Jane',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.update('999', { firstName: 'Jane' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a user successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await service.delete('1');

      expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.delete('999')).rejects.toThrow(NotFoundException);
    });
  });
});
