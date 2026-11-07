import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateGoalDto {
  @ApiPropertyOptional({
    example: 'Advanced Distributed Systems & Microservices',
    description: 'Updated title of the study goal',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description of the study goal',
    description: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
