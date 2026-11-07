import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ParseUuidParamPipe } from '../common/pipes/parse-uuid.pipe';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile of authenticated user' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get user by ID (Learner can access own account; Mentor can view any account)',
  })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @ApiResponse({ status: 403, description: 'Forbidden access to other user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.findById(id, user);
  }
}
