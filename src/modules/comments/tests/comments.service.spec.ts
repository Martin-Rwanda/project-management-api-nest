import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from '../../organizations/organizations.service';
import { ProjectsService } from '../../projects/projects.service';
import { TasksService } from '../../tasks/tasks.service';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentsService } from '../comments.service';

const mockComment = {
  id: 'comment-1',
  content: 'This task needs more details',
  taskId: 'task-1',
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTask = {
  id: 'task-1',
  title: 'Design homepage',
  projectId: 'project-1',
  createdBy: 'user-1',
};

const mockProject = {
  id: 'project-1',
  name: 'Website Redesign',
  organizationId: 'org-1',
  createdBy: 'user-1',
};

const mockCommentRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByTaskId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTasksService = {
  findById: jest.fn(),
};

const mockProjectsService = {
  findById: jest.fn(),
};

const mockOrganizationsService = {
  isMember: jest.fn(),
};

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentRepository, useValue: mockCommentRepository },
        { provide: TasksService, useValue: mockTasksService },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      mockTasksService.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockCommentRepository.create.mockResolvedValue(mockComment);

      const result = await service.create(
        { content: 'This task needs more details', taskId: 'task-1' },
        'user-1',
      );

      expect(result).toEqual(mockComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        content: 'This task needs more details',
        taskId: 'task-1',
        createdBy: 'user-1',
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockTasksService.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(
        service.create(
          { content: 'This task needs more details', taskId: 'task-1' },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockCommentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a comment by id', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      const result = await service.findById('comment-1');

      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findById.mockResolvedValue(null);

      await expect(service.findById('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTaskId', () => {
    it('should return comments for a task', async () => {
      mockTasksService.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(true);
      mockCommentRepository.findByTaskId.mockResolvedValue([mockComment]);

      const result = await service.findByTaskId('task-1', 'user-1');

      expect(result).toEqual([mockComment]);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockTasksService.findById.mockResolvedValue(mockTask);
      mockProjectsService.findById.mockResolvedValue(mockProject);
      mockOrganizationsService.isMember.mockResolvedValue(false);

      await expect(
        service.findByTaskId('task-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a comment successfully', async () => {
      const updated = { ...mockComment, content: 'Updated content' };
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockCommentRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        'comment-1',
        { content: 'Updated content' },
        'user-1',
      );

      expect(result.content).toEqual('Updated content');
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      await expect(
        service.update('comment-1', { content: 'Updated' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('wrong-id', { content: 'Updated' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a comment successfully', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);
      mockCommentRepository.delete.mockResolvedValue(undefined);

      await service.delete('comment-1', 'user-1');

      expect(mockCommentRepository.delete).toHaveBeenCalledWith('comment-1');
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      mockCommentRepository.findById.mockResolvedValue(mockComment);

      await expect(
        service.delete('comment-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockCommentRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete('wrong-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});