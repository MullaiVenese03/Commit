import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class CreateSessionDto {
  @ApiProperty({
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Topic UUID being studied',
  })
  @Matches(UUID_REGEX, { message: 'topicId must be a valid UUID' })
  @IsNotEmpty()
  topicId!: string;

  @ApiProperty({
    example: '2026-11-06T00:00:00.000Z',
    description: 'Date of the study session (cannot be in the future)',
  })
  @IsDateString()
  @IsNotEmpty()
  studyDate!: string;

  @ApiProperty({
    example: 60,
    description: 'Duration of the study session in minutes',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  minutes!: number;

  @ApiPropertyOptional({
    example: 'Deep dive into NestJS interceptors and exception filters.',
    description: 'Optional reflection or study notes',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
