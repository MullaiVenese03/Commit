import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { GetActivityDto } from './dto/get-activity.dto';
import { GetStreaksDto } from './dto/get-streaks.dto';
import { GetWeeklyTargetDto } from './dto/get-weekly-target.dto';
import { UpdateWeeklyTargetDto } from './dto/update-weekly-target.dto';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('activity')
  @ApiOperation({
    summary:
      'Get daily study activity and heatmap records (Learners view own; Mentors can specify learnerId)',
  })
  @ApiResponse({ status: 200, description: 'Daily study activity records' })
  @ApiResponse({ status: 400, description: 'Bad request: invalid dates or missing learnerId for mentors' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner cross-access' })
  @ApiResponse({ status: 404, description: 'Target learner not found' })
  async getActivity(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetActivityDto,
  ) {
    return this.progressService.getActivity(user, query);
  }

  @Get('streaks')
  @ApiOperation({
    summary:
      'Get study streak metrics (Current streak, longest streak, total active days)',
  })
  @ApiResponse({ status: 200, description: 'Study streak metrics' })
  @ApiResponse({ status: 400, description: 'Bad request: invalid reference today or missing learnerId for mentors' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner cross-access' })
  @ApiResponse({ status: 404, description: 'Target learner not found' })
  async getStreaks(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetStreaksDto,
  ) {
    return this.progressService.getStreaks(user, query);
  }

  @Get('weekly-target')
  @ApiOperation({
    summary:
      'Get weekly study target and current-week completion progress',
  })
  @ApiResponse({ status: 200, description: 'Weekly study target metrics' })
  @ApiResponse({ status: 400, description: 'Bad request: missing learnerId for mentors or invalid date' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner cross-access' })
  @ApiResponse({ status: 404, description: 'Target learner not found' })
  async getWeeklyTarget(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetWeeklyTargetDto,
  ) {
    return this.progressService.getWeeklyTarget(user, query);
  }

  @Patch('weekly-target')
  @ApiOperation({
    summary:
      'Update weekly study target (Learners can only update their own target; Mentors forbidden)',
  })
  @ApiResponse({ status: 200, description: 'Weekly study target updated' })
  @ApiResponse({ status: 400, description: 'Bad request: invalid target minutes' })
  @ApiResponse({ status: 403, description: 'Forbidden: mentor modification forbidden' })
  async updateWeeklyTarget(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateWeeklyTargetDto,
    @Query() query: GetWeeklyTargetDto,
  ) {
    return this.progressService.updateWeeklyTarget(user, dto, query);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get progress metrics for current authenticated user (Learner sees self)',
  })
  @ApiResponse({ status: 200, description: 'Progress summary with streak and weekly target' })
  async getMyProgress(
    @CurrentUser() user: CurrentUserPayload,
    @Query('today') today?: string,
  ) {
    return this.progressService.getLearnerProgress(user.id, user, today);
  }

  @Get(':learnerId')
  @ApiOperation({
    summary:
      'Get progress metrics for specific learner (Learners can only view own; Mentors can view any learner)',
  })
  @ApiResponse({ status: 200, description: 'Progress summary for specified learner' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another learner\'s progress' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async getLearnerProgress(
    @Param('learnerId', ParseUuidParamPipe) learnerId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('today') today?: string,
  ) {
    return this.progressService.getLearnerProgress(learnerId, user, today);
  }
}
