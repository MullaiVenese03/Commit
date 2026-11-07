import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({
    example: 'Distributed Systems & Microservices',
    description: 'Title of the study goal',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({
    example: 'Mastering distributed consistency, message brokers, and failure domains.',
    description: 'Detailed description of the goal',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
