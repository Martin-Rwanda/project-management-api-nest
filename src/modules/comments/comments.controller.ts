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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';

interface JwtUser {
  id: string;
  email: string;
}

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Comment> {
    return this.commentsService.create(createCommentDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiQuery({ name: 'taskId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns all comments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query('taskId') taskId: string, @CurrentUser() user: JwtUser): Promise<Comment[]> {
    return this.commentsService.findByTaskId(taskId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiResponse({ status: 200, description: 'Returns a comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment by id' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment by id' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser): Promise<void> {
    return this.commentsService.delete(id, user.id);
  }
}
