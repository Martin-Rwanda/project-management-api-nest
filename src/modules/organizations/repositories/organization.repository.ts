import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const organization = this.repository.create(data);
    return this.repository.save(organization);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user'],
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['owner', 'members', 'members.user'],
    });
  }

  async findByOwnerId(ownerId: string): Promise<Organization[]> {
    return this.repository.find({
      where: { ownerId },
      relations: ['owner', 'members'],
    });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
