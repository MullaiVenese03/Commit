import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { CALENDAR_DATE_REGEX } from '../utils/date.util';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class GetActivityDto {
  @ApiPropertyOptional({
    example: 'a0000000-0000-0000-0000-000000000001',
    description: 'Target learner UUID (Mentors only; learners default to self)',
  })
  @Matches(UUID_REGEX, { message: 'learnerId must be a valid UUID' })
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date in YYYY-MM-DD format (inclusive)',
  })
  @Matches(CALENDAR_DATE_REGEX, { message: 'startDate must be in YYYY-MM-DD format' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-09',
    description: 'End date in YYYY-MM-DD format (inclusive)',
  })
  @Matches(CALENDAR_DATE_REGEX, { message: 'endDate must be in YYYY-MM-DD format' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: '2026-11-09',
    description: 'Reference browser-local today date in YYYY-MM-DD format',
  })
  @Matches(CALENDAR_DATE_REGEX, { message: 'today must be in YYYY-MM-DD format' })
  @IsOptional()
  today?: string;
}
