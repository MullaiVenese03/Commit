import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseUuidParamPipe } from '../common/pipes/parse-uuid.pipe';
import { Role } from '../generated/prisma/enums';
import { MentorService } from './mentor.service';

@ApiTags('mentor')
@ApiBearerAuth()
@Roles(Role.MENTOR)
@UseGuards(RolesGuard)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('learners')
  @ApiOperation({ summary: 'List all learners and their aggregate progress (Mentors only)' })
  @ApiResponse({ status: 200, description: 'List of learners with progress' })
  @ApiResponse({ status: 403, description: 'Forbidden: requires MENTOR role' })
  async listLearners() {
    return this.mentorService.listLearners();
  }

  @Get('learners/:learnerId/goals')
  @ApiOperation({ summary: 'View all goals and topics for a learner (Mentors only)' })
  @ApiResponse({ status: 200, description: 'Learner goals with topics' })
  @ApiResponse({ status: 403, description: 'Forbidden: requires MENTOR role' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async getLearnerGoals(@Param('learnerId', ParseUuidParamPipe) learnerId: string) {
    return this.mentorService.getLearnerGoals(learnerId);
  }

  @Get('learners/:learnerId/sessions')
  @ApiOperation({ summary: 'View all study sessions for a learner (Mentors only)' })
  @ApiResponse({ status: 200, description: 'Learner study sessions' })
  @ApiResponse({ status: 403, description: 'Forbidden: requires MENTOR role' })
  @ApiResponse({ status: 404, description: 'Learner not found' })
  async getLearnerSessions(@Param('learnerId', ParseUuidParamPipe) learnerId: string) {
    return this.mentorService.getLearnerSessions(learnerId);
  }
}
