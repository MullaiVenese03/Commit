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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { ParseUuidParamPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List goals (Learners see only their own goals; Mentors see all goals or can filter by learnerId)',
  })
  @ApiQuery({
    name: 'learnerId',
    required: false,
    description: 'Filter goals by learner ID (Mentors only)',
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('learnerId') learnerId?: string,
  ) {
    return this.goalsService.findAll(user, learnerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new goal for the authenticated learner' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  @ApiResponse({ status: 403, description: 'Mentors cannot create learner goals' })
  async create(
    @Body() dto: CreateGoalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.goalsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get goal details (Learner can access own; Mentor can access any; other learners forbidden)',
  })
  @ApiResponse({ status: 200, description: 'Goal details' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another learner\'s goal' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findOne(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.goalsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a goal (Learners can only update their own goal; Mentors cannot update)',
  })
  @ApiResponse({ status: 200, description: 'Goal updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async update(
    @Param('id', ParseUuidParamPipe) id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.goalsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a goal (Learners can only delete their own goal; Mentors cannot delete)',
  })
  @ApiResponse({ status: 204, description: 'Goal deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized learner or mentor modification' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async remove(
    @Param('id', ParseUuidParamPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.goalsService.remove(id, user);
  }
}
