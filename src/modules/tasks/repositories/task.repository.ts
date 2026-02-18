import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'common/dto/pagination.dto';
import { PaginatedResult } from 'common/interfaces/paginated-result.interface';
import { FilterTaskDto } from '../dto';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.repository.create(data);
    return this.repository.save(task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['project', 'creator', 'assignee'],
    });
  }

  async findByProjectId(
    projectId: string,
    filters: FilterTaskDto,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Task>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.project_id = :projectId', { projectId });

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.assignedTo) {
      query.andWhere('task.assigned_to = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    const [data, total] = await query
      .orderBy('task.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
