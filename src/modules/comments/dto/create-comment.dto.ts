import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This task needs more details' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @ApiProperty({ example: 'uuid-of-task' })
  @IsUUID()
  @IsNotEmpty()
  taskId!: string;
}
