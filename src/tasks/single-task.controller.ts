import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class SingleTaskController {
  constructor(private tasksService: TasksService) {}

  @Get('my')
  findMyTasks(@Req() req: any) {
    return this.tasksService.findMyTasks(req.user.id);
  }

  @Get(':taskId')
  findOne(@Param('taskId') taskId: string) {
    return this.tasksService.findOne(taskId);
  }
}
