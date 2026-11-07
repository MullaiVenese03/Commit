import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class UpdateTopicDto {
  @ApiPropertyOptional({
    example: 'NestJS Advanced Dependency Injection Internals',
    description: 'Updated title of the topic',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated ordering position',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Completion status of topic',
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['c0000000-0000-0000-0000-000000000001'],
    description: 'Updated list of prerequisite topic IDs',
  })
  @IsArray()
  @Matches(UUID_REGEX, { each: true, message: 'Each prerequisiteTopicId must be a valid UUID' })
  @IsOptional()
  prerequisiteTopicIds?: string[];
}
