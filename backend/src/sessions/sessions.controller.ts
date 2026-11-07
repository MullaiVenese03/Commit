import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ParseUuidParamPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateSessionDto } from './dto/create-session.dto';
import { FilterSessionsDto } from './dto/filter-sessions.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List study sessions with optional filters (goalId, topicId, learnerId, startDate, endDate)',
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filter: FilterSessionsDto,
  ) {
    return this.sessionsService.findAll(user, filter);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get study session by ID (Learner can access own; Mentor can access any; other learners forbidden)',
  })
  @ApiResponse({ status: 200, description: 'Study session details' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.sessionsService.findOne(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a study session (Learners only)' })
  @ApiResponse({ status: 201, description: 'Study session logged' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  async create(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.sessionsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update study session (Learners can only update their own sessions; Mentors cannot update)',
  })
  @ApiResponse({ status: 200, description: 'Study session updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async update(
    @Param('id', ParseUuidParamPipe) id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.sessionsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete study session (Learners can only delete their own sessions; Mentors cannot delete)',
  })
  @ApiResponse({ status: 204, description: 'Study session deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async remove(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.sessionsService.remove(id, user);
  }
}
