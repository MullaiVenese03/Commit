import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    example: '2026-11-06T00:00:00.000Z',
    description: 'Updated study date',
  })
  @IsDateString()
  @IsOptional()
  studyDate?: string;

  @ApiPropertyOptional({
    example: 90,
    description: 'Updated session minutes',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  minutes?: number;

  @ApiPropertyOptional({
    example: 'Updated study session notes.',
    description: 'Updated note',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
