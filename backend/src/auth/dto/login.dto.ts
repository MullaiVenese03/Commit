import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'alex.mercer@commit.dev',
    description: 'Registered email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Learner123!Pass',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
