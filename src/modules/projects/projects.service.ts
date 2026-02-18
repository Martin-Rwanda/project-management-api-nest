import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { Project } from './entities/project.entity';
import { ProjectRepository } from './repositories/project.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const isMember = await this.organizationsService.isMember(
      createProjectDto.organizationId,
      userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.projectRepository.create({
      ...createProjectDto,
      createdBy: userId,
    });
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  async findByOrganizationId(organizationId: string, userId: string): Promise<Project[]> {
    const isMember = await this.organizationsService.isMember(organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.projectRepository.findByOrganizationId(organizationId);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findById(id);

    const isMember = await this.organizationsService.isMember(project.organizationId, userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const updated = await this.projectRepository.update(id, updateProjectDto);

    if (!updated) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.findById(id);

    if (project.createdBy !== userId) {
      throw new ForbiddenException('Only the project creator can delete it');
    }

    await this.projectRepository.delete(id);
  }
}
