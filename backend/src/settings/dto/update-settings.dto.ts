import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum session minutes allowed (minimum 1, maximum 60)',
  })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  minSessionMinutes?: number;

  @ApiPropertyOptional({
    example: 360,
    description: 'Maximum session minutes allowed (minimum 60, maximum 1440)',
  })
  @IsInt()
  @Min(60)
  @Max(1440)
  @IsOptional()
  maxSessionMinutes?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum prerequisites allowed per topic (minimum 1, maximum 20)',
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  maxPrerequisitesPerTopic?: number;
}
