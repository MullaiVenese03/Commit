import {
  Controller,
  Get,
  Param,
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
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get progress metrics for current authenticated user (Learner sees self)',
  })
  @ApiResponse({ status: 200, description: 'Progress summary' })
  async getMyProgress(@CurrentUser() user: CurrentUserPayload) {
    return this.progressService.getLearnerProgress(user.id, user);
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
  ) {
    return this.progressService.getLearnerProgress(learnerId, user);
  }
}
