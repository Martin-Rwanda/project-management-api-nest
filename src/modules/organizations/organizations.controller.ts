import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOrganizationDto, InviteMemberDto, UpdateOrganizationDto } from './dto';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

interface JwtUser {
  id: string;
  email: string;
}

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 409, description: 'Organization already exists' })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Organization> {
    return this.organizationsService.create(createOrganizationDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for current user' })
  @ApiResponse({ status: 200, description: 'Returns all organizations' })
  async findAll(@CurrentUser() user: JwtUser): Promise<Organization[]> {
    return this.organizationsService.findUserOrganizations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by id' })
  @ApiResponse({ status: 200, description: 'Returns an organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id') id: string): Promise<Organization> {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization by id' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Organization> {
    return this.organizationsService.update(id, updateOrganizationDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization by id' })
  @ApiResponse({ status: 204, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser): Promise<void> {
    return this.organizationsService.delete(id, user.id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a member to organization' })
  @ApiResponse({ status: 201, description: 'Member invited successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @CurrentUser() user: JwtUser,
  ): Promise<OrganizationMember> {
    return this.organizationsService.inviteMember(id, inviteMemberDto, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an organization' })
  @ApiResponse({ status: 200, description: 'Returns all members' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getMembers(@Param('id') id: string): Promise<OrganizationMember[]> {
    return this.organizationsService.getMembers(id);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from organization' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.organizationsService.removeMember(id, memberId, user.id);
  }
}
