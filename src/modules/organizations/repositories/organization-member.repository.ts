import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember, OrganizationRole } from '../entities/organization-member.entity';

@Injectable()
export class OrganizationMemberRepository {
  constructor(
    @InjectRepository(OrganizationMember)
    private readonly repository: Repository<OrganizationMember>,
  ) {}

  async create(data: Partial<OrganizationMember>): Promise<OrganizationMember> {
    const member = this.repository.create(data);
    return this.repository.save(member);
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return this.repository.findOne({
      where: { organizationId, userId },
      relations: ['user', 'organization'],
    });
  }

  async findByOrganizationId(organizationId: string): Promise<OrganizationMember[]> {
    return this.repository.find({
      where: { organizationId },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<OrganizationMember[]> {
    return this.repository.find({
      where: { userId },
      relations: ['organization'],
    });
  }

  async updateRole(organizationId: string, userId: string, role: OrganizationRole): Promise<void> {
    await this.repository.update({ organizationId, userId }, { role });
  }

  async delete(organizationId: string, userId: string): Promise<void> {
    await this.repository.delete({ organizationId, userId });
  }
}
