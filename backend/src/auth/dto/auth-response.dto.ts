import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums';

export class UserProfileDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Alex Mercer' })
  name!: string;

  @ApiProperty({ example: 'alex.mercer@commit.dev' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.LEARNER })
  role!: Role;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT access token',
  })
  accessToken!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
