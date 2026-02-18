import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from '../../organizations/organizations.service';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectsService } from '../projects.service';

const mockProject = {
  id: 'project-1',
  name: 'Website Redesign',
  description: 'Redesign the company website',
  organizationId: 'org-1',
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProjectRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByOrganizationId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockOrganizationsService = {
  isMember: jest.fn(),
  findById: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectRepository, useValue: mockProjectRepository },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockProjectRepository.create.mockResolvedValue(mockProject);

      const result = await service.create(
        {
          name: 'Website Redesign',
          description: 'Redesign the company website',
          organizationId: 'org-1',
        },
        'user-1',
      );

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        name: 'Website Redesign',
        description: 'Redesign the company website',
        organizationId: 'org-1',
        createdBy: 'user-1',
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(
        service.create(
          {
            name: 'Website Redesign',
            organizationId: 'org-1',
          },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a project by id', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      const result = await service.findById('project-1');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(service.findById('wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrganizationId', () => {
    it('should return projects for an organization', async () => {
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockProjectRepository.findByOrganizationId.mockResolvedValue([mockProject]);

      const result = await service.findByOrganizationId('org-1', 'user-1');

      expect(result).toEqual([mockProject]);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(service.findByOrganizationId('org-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a project successfully', async () => {
      const updated = { ...mockProject, name: 'New Name' };
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockProjectRepository.update.mockResolvedValue(updated);

      const result = await service.update('project-1', { name: 'New Name' }, 'user-1');

      expect(result.name).toEqual('New Name');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(service.update('project-1', { name: 'New Name' }, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a project successfully', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.delete.mockResolvedValue(undefined);

      await service.delete('project-1', 'user-1');

      expect(mockProjectRepository.delete).toHaveBeenCalledWith('project-1');
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);

      await expect(service.delete('project-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(service.delete('wrong-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
