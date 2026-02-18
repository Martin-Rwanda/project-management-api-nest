import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.repository.create(data);
    return this.repository.save(project);
  }

  async findById(id: string): Promise<Project | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['organization', 'creator'],
    });
  }

  async findByOrganizationId(organizationId: string): Promise<Project[]> {
    return this.repository.find({
      where: { organizationId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCreatedBy(createdBy: string): Promise<Project[]> {
    return this.repository.find({
      where: { createdBy },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<Project>): Promise<Project | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
