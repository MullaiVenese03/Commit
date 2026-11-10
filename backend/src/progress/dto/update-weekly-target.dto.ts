import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateWeeklyTargetDto {
  @ApiPropertyOptional({
    example: 600,
    description: 'Weekly study target in minutes (60 to 4,200)',
  })
  @IsInt({ message: 'targetMinutes must be an integer' })
  @Min(60, { message: 'Weekly target must be at least 60 minutes' })
  @Max(4200, { message: 'Weekly target cannot exceed 4,200 minutes (70 hours)' })
  @IsOptional()
  targetMinutes?: number;

  @ApiPropertyOptional({
    example: 600,
    description: 'Alternative parameter name matching database column',
  })
  @IsInt({ message: 'weeklyStudyTargetMinutes must be an integer' })
  @Min(60, { message: 'Weekly target must be at least 60 minutes' })
  @Max(4200, { message: 'Weekly target cannot exceed 4,200 minutes (70 hours)' })
  @IsOptional()
  weeklyStudyTargetMinutes?: number;
}
