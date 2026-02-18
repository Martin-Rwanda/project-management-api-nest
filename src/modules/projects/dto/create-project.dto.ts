import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({ example: 'Redesign the company website' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;
}
