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
import { CreateTopicDto } from './dto/create-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicsService } from './topics.service';

@ApiTags('topics')
@ApiBearerAuth()
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Patch('goal/:goalId/reorder')
  @ApiOperation({
    summary:
      'Reorder topics within a goal (Learners can only reorder their own topics)',
  })
  @ApiResponse({ status: 200, description: 'Topics reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid topic list' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async reorder(
    @Param('goalId', ParseUuidParamPipe) goalId: string,
    @Body() dto: ReorderTopicsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.reorder(goalId, dto.topicIds, user);
  }

  @Get('goal/:goalId')
  @ApiOperation({
    summary:
      'List all topics for a goal (Learners see only their goal topics; Mentors can view any)',
  })
  @ApiResponse({ status: 200, description: 'Topics for goal' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findByGoal(
    @Param('goalId', ParseUuidParamPipe) goalId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.findByGoal(goalId, user);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get topic by ID (Learner can view own goal topic; Mentor can view any)',
  })
  @ApiResponse({ status: 200, description: 'Topic details' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async findOne(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.findOne(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a topic inside a goal (Learners only)' })
  @ApiResponse({ status: 201, description: 'Topic created' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  async create(
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update topic (Learners can only update their own goal topics; Mentors cannot update)',
  })
  @ApiResponse({ status: 200, description: 'Topic updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async update(
    @Param('id', ParseUuidParamPipe) id: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.update(id, dto, user);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Mark a topic as complete (Learners only)',
  })
  @ApiResponse({ status: 200, description: 'Topic marked complete' })
  @ApiResponse({ status: 400, description: 'Cannot complete topic whose prerequisites are not yet completed' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  async complete(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.complete(id, user);
  }

  @Patch(':id/reopen')
  @ApiOperation({
    summary: 'Reopen a completed topic (recursively resets dependent topics to incomplete)',
  })
  @ApiResponse({ status: 200, description: 'Topic reopened' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  async reopen(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.reopen(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete topic (Learners can only delete their own goal topics; Mentors cannot delete)',
  })
  @ApiResponse({ status: 204, description: 'Topic deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async remove(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.topicsService.remove(id, user);
  }
}
