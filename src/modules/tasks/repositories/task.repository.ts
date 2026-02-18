import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findByProjectId(projectId: string, filters: FilterTaskDto): Promise<Task[]> {
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

    return query.orderBy('task.created_at', 'DESC').getMany();
  }

  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
