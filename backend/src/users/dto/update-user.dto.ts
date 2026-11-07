import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alex Mercer', description: 'Updated display name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;
}
