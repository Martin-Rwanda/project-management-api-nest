import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from '../organizations/organizations.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from './entities/comment.entity';
import { CommentRepository } from './repositories/comment.repository';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    const task = await this.tasksService.findById(createCommentDto.taskId);
    const project = await this.projectsService.findById(task.projectId);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.commentRepository.create({
      ...createCommentDto,
      createdBy: userId,
    });
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  async findByTaskId(taskId: string, userId: string): Promise<Comment[]> {
    const task = await this.tasksService.findById(taskId);
    const project = await this.projectsService.findById(task.projectId);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.commentRepository.findByTaskId(taskId);
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment> {
    const comment = await this.findById(id);

    if (comment.createdBy !== userId) {
      throw new ForbiddenException('Only the comment creator can update it');
    }

    const updated = await this.commentRepository.update(id, updateCommentDto);

    if (!updated) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findById(id);

    if (comment.createdBy !== userId) {
      throw new ForbiddenException('Only the comment creator can delete it');
    }

    await this.commentRepository.delete(id);
  }
}
