import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from '../../organizations/organizations.service';
import { ProjectsService } from '../../projects/projects.service';
import { TaskStatus, TaskPriority } from '../entities/task.entity';
import { TaskRepository } from '../repositories/task.repository';
import { TasksService } from '../tasks.service';

const mockTask = {
  id: 'task-1',
  title: 'Design homepage',
  description: 'Design the homepage',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  projectId: 'project-1',
  createdBy: 'user-1',
  assignedTo: null,
  dueDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProject = {
  id: 'project-1',
  name: 'Website Redesign',
  organizationId: 'org-1',
  createdBy: 'user-1',
};

const mockTaskRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByProjectId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectsService = {
  findById: jest.fn(),
};

const mockOrganizationsService = {
  isMember: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useValue: mockTaskRepository },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockTaskRepository.create.mockResolvedValue(mockTask);

      const result = await service.create(
        {
          title: 'Design homepage',
          description: 'Design the homepage',
          projectId: 'project-1',
          priority: TaskPriority.HIGH,
        },
        'user-1',
      );

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: 'Design homepage',
        description: 'Design the homepage',
        projectId: 'project-1',
        priority: TaskPriority.HIGH,
        createdBy: 'user-1',
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(
        service.create(
          {
            title: 'Design homepage',
            projectId: 'project-1',
          },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockTaskRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a task by id', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);

      const result = await service.findById('task-1');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(service.findById('wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProjectId', () => {
    it('should return tasks for a project', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockTaskRepository.findByProjectId.mockResolvedValue([mockTask]);

      const result = await service.findByProjectId('project-1', {}, 'user-1', { page: 1, limit: 10 });

      expect(result).toEqual([mockTask]);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(service.findByProjectId('project-1', {}, 'user-1', { page: 1, limit: 10 })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updated = { ...mockTask, title: 'Updated title' };
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue(updated);

      const result = await service.update('task-1', { title: 'Updated title' }, 'user-1');

      expect(result.title).toEqual('Updated title');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(service.update('task-1', { title: 'Updated title' }, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a task successfully', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue(undefined);

      await service.delete('task-1', 'user-1');

      expect(mockTaskRepository.delete).toHaveBeenCalledWith('task-1');
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      mockTaskRepository.findById.mockResolvedValue(mockTask);

      await expect(service.delete('task-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(service.delete('wrong-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
