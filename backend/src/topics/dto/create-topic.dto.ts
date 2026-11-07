import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class CreateTopicDto {
  @ApiProperty({
    example: 'b0000000-0000-0000-0000-000000000001',
    description: 'ID of the goal this topic belongs to',
  })
  @Matches(UUID_REGEX, { message: 'goalId must be a valid UUID' })
  @IsNotEmpty()
  goalId!: string;

  @ApiProperty({
    example: 'NestJS Dependency Injection Internals',
    description: 'Title of the topic',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({
    example: 'Deep dive into IoC containers, tokens, dynamic modules.',
    description: 'Topic description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'Ordering position of the topic',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number = 0;

  @ApiPropertyOptional({
    type: [String],
    example: ['c0000000-0000-0000-0000-000000000001'],
    description: 'List of prerequisite topic IDs within the same goal',
  })
  @IsArray()
  @Matches(UUID_REGEX, { each: true, message: 'Each prerequisiteTopicId must be a valid UUID' })
  @IsOptional()
  prerequisiteTopicIds?: string[];
}
