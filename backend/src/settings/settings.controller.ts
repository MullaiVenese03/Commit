import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get global system settings (Learners and Mentors)' })
  @ApiResponse({ status: 200, description: 'Current system settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(Role.MENTOR)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update global system settings (Mentors only - Learners receive 403 Forbidden)',
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: requires MENTOR role' })
  async updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.updateSettings(dto, user);
  }
}
