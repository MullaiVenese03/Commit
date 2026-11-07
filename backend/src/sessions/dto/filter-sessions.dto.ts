import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class FilterSessionsDto {
  @ApiPropertyOptional({
    example: 'b0000000-0000-0000-0000-000000000001',
    description: 'Filter sessions by goal ID',
  })
  @Matches(UUID_REGEX, { message: 'goalId must be a valid UUID' })
  @IsOptional()
  goalId?: string;

  @ApiPropertyOptional({
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Filter sessions by topic ID',
  })
  @Matches(UUID_REGEX, { message: 'topicId must be a valid UUID' })
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    example: 'a0000000-0000-0000-0000-000000000001',
    description: 'Filter sessions by learner ID (Mentors only)',
  })
  @Matches(UUID_REGEX, { message: 'learnerId must be a valid UUID' })
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Filter sessions on or after startDate (inclusive, YYYY-MM-DD or ISO)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Filter sessions on or before endDate (inclusive, YYYY-MM-DD or ISO)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
