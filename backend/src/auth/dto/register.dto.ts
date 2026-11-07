import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'john.doe@commit.dev',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password (minimum 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
