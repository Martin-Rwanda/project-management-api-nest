import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  async create(data: Partial<Comment>): Promise<Comment> {
    const comment = this.repository.create(data);
    return this.repository.save(comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['creator', 'task'],
    });
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { taskId },
      relations: ['creator'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, data: Partial<Comment>): Promise<Comment | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
