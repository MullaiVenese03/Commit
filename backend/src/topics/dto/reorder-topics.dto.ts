import { ApiProperty } from '@nestjs/swagger';
import { IsArray, Matches } from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class ReorderTopicsDto {
  @ApiProperty({
    type: [String],
    example: [
      'c0000000-0000-0000-0000-000000000002',
      'c0000000-0000-0000-0000-000000000001',
    ],
    description:
      'Ordered list of topic UUIDs defining their new positions (0-indexed)',
  })
  @IsArray()
  @Matches(UUID_REGEX, {
    each: true,
    message: 'Each topicId must be a valid UUID',
  })
  topicIds!: string[];
}
