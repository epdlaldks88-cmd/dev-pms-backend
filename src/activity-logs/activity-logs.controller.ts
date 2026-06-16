import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ActivityLogsController {
  constructor(private activityLogsService: ActivityLogsService) {}

  @Get('projects/:projectId/activity')
  findByProject(@Param('projectId') projectId: string, @Query('limit') limit?: string) {
    return this.activityLogsService.findByProject(projectId, limit ? +limit : 50);
  }

  @Get('tasks/:taskId/activity')
  findByTask(@Param('taskId') taskId: string) {
    return this.activityLogsService.findByTask(taskId);
  }
}
