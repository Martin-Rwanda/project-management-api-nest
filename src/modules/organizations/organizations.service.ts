import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateOrganizationDto, InviteMemberDto, UpdateOrganizationDto } from './dto';
import { OrganizationMember, OrganizationRole } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationMemberRepository } from './repositories/organization-member.repository';
import { OrganizationRepository } from './repositories/organization.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly usersService: UsersService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<Organization> {
    const slug = this.generateSlug(createOrganizationDto.name);

    const existingOrg = await this.organizationRepository.findBySlug(slug);
    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    const organization = await this.organizationRepository.create({
      ...createOrganizationDto,
      slug,
      ownerId,
    });

    // Add owner as admin member
    await this.organizationMemberRepository.create({
      organizationId: organization.id,
      userId: ownerId,
      role: OrganizationRole.ADMIN,
    });

    return organization;
  }

  async findById(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }

    return organization;
  }

  async findUserOrganizations(userId: string): Promise<Organization[]> {
    return this.organizationRepository.findByOwnerId(userId);
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const organization = await this.findById(id);

    if (organization.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update the organization');
    }

    const updated = await this.organizationRepository.update(id, updateOrganizationDto);

    if (!updated) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const organization = await this.findById(id);

    if (organization.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the organization');
    }

    await this.organizationRepository.delete(id);
  }

  async inviteMember(
    organizationId: string,
    inviteMemberDto: InviteMemberDto,
    userId: string,
  ): Promise<OrganizationMember> {
    const organization = await this.findById(organizationId);

    // Check if requester is admin
    const requesterMember = await this.organizationMemberRepository.findByOrganizationAndUser(
      organizationId,
      userId,
    );

    if (!requesterMember || requesterMember.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException('Only admins can invite members');
    }

    // Find user by email
    const invitedUser = await this.usersService.findByEmail(inviteMemberDto.email);

    if (!invitedUser) {
      throw new NotFoundException(`User with email ${inviteMemberDto.email} not found`);
    }

    // Check if already a member
    const existingMember = await this.organizationMemberRepository.findByOrganizationAndUser(
      organization.id,
      invitedUser.id,
    );

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    return this.organizationMemberRepository.create({
      organizationId: organization.id,
      userId: invitedUser.id,
      role: inviteMemberDto.role,
    });
  }

  async removeMember(organizationId: string, memberId: string, userId: string): Promise<void> {
    const organization = await this.findById(organizationId);

    if (organization.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    if (memberId === userId) {
      throw new ForbiddenException('Owner cannot remove themselves');
    }

    await this.organizationMemberRepository.delete(organizationId, memberId);
  }

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    await this.findById(organizationId);
    return this.organizationMemberRepository.findByOrganizationId(organizationId);
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.organizationMemberRepository.findByOrganizationAndUser(
      organizationId,
      userId,
    );
    return !!member;
  }
}
