import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../users/users.service';
import { OrganizationRole } from '../entities/organization-member.entity';
import { OrganizationMemberRepository } from '../repositories/organization-member.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationsService } from '../organizations.service';

const mockUser = {
  id: '1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
};

const mockOrganization = {
  id: 'org-1',
  name: 'Tech Corp',
  slug: 'tech-corp',
  description: 'A tech company',
  ownerId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMember = {
  id: 'member-1',
  organizationId: 'org-1',
  userId: '1',
  role: OrganizationRole.ADMIN,
  createdAt: new Date(),
};

const mockOrganizationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByOwnerId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockOrganizationMemberRepository = {
  create: jest.fn(),
  findByOrganizationAndUser: jest.fn(),
  findByOrganizationId: jest.fn(),
  findByUserId: jest.fn(),
  updateRole: jest.fn(),
  delete: jest.fn(),
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationRepository,
          useValue: mockOrganizationRepository,
        },
        {
          provide: OrganizationMemberRepository,
          useValue: mockOrganizationMemberRepository,
        },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization successfully', async () => {
      mockOrganizationRepository.findBySlug.mockResolvedValue(null);
      mockOrganizationRepository.create.mockResolvedValue(mockOrganization);
      mockOrganizationMemberRepository.create.mockResolvedValue(mockMember);

      const result = await service.create(
        { name: 'Tech Corp', description: 'A tech company' },
        '1',
      );

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.create).toHaveBeenCalled();
      expect(mockOrganizationMemberRepository.create).toHaveBeenCalledWith({
        organizationId: mockOrganization.id,
        userId: '1',
        role: OrganizationRole.ADMIN,
      });
    });

    it('should throw ConflictException if organization name already exists', async () => {
      mockOrganizationRepository.findBySlug.mockResolvedValue(mockOrganization);

      await expect(service.create({ name: 'Tech Corp' }, '1')).rejects.toThrow(ConflictException);

      expect(mockOrganizationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an organization by id', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await service.findById('org-1');

      expect(result).toEqual(mockOrganization);
    });

    it('should throw NotFoundException if organization not found', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(service.findById('wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an organization successfully', async () => {
      const updated = { ...mockOrganization, name: 'New Name' };
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.update.mockResolvedValue(updated);

      const result = await service.update('org-1', { name: 'New Name' }, '1');

      expect(result.name).toEqual('New Name');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(service.update('org-1', { name: 'New Name' }, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an organization successfully', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.delete.mockResolvedValue(undefined);

      await service.delete('org-1', '1');

      expect(mockOrganizationRepository.delete).toHaveBeenCalledWith('org-1');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(service.delete('org-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteMember', () => {
    it('should invite a member successfully', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationMemberRepository.findByOrganizationAndUser
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(null);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        id: '2',
        email: 'jane@example.com',
      });
      mockOrganizationMemberRepository.create.mockResolvedValue({
        ...mockMember,
        userId: '2',
        role: OrganizationRole.MEMBER,
      });

      const result = await service.inviteMember(
        'org-1',
        { email: 'jane@example.com', role: OrganizationRole.MEMBER },
        '1',
      );

      expect(result.role).toEqual(OrganizationRole.MEMBER);
    });

    it('should throw ForbiddenException if requester is not admin', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationMemberRepository.findByOrganizationAndUser.mockResolvedValue({
        ...mockMember,
        role: OrganizationRole.VIEWER,
      });

      await expect(
        service.inviteMember(
          'org-1',
          { email: 'jane@example.com', role: OrganizationRole.MEMBER },
          '1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if invited user not found', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationMemberRepository.findByOrganizationAndUser.mockResolvedValue(mockMember);
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.inviteMember(
          'org-1',
          { email: 'notfound@example.com', role: OrganizationRole.MEMBER },
          '1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
