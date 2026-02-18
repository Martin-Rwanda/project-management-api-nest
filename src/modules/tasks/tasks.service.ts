import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'common/dto/pagination.dto';
import { PaginatedResult } from 'common/interfaces/paginated-result.interface';
import { OrganizationsService } from '../organizations/organizations.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto, FilterTaskDto, UpdateTaskDto } from './dto';
import { Task } from './entities/task.entity';
import { TaskRepository } from './repositories/task.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectsService: ProjectsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.projectsService.findById(createTaskDto.projectId);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.taskRepository.create({
      ...createTaskDto,
      createdBy: userId,
    });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return task;
  }

  async findByProjectId(
    projectId: string,
    filters: FilterTaskDto,
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Task>> {
    const project = await this.projectsService.findById(projectId);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.taskRepository.findByProjectId(projectId, filters, pagination);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findById(id);
    const project = await this.projectsService.findById(task.projectId);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const updated = await this.taskRepository.update(id, updateTaskDto);

    if (!updated) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);

    if (task.createdBy !== userId) {
      throw new ForbiddenException('Only the task creator can delete it');
    }

    await this.taskRepository.delete(id);
  }
}
