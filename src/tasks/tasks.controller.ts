import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: { stepId?: string; status?: string; priority?: string; assigneeId?: string },
  ) {
    return this.tasksService.findAll(projectId, query);
  }

  @Get('kanban')
  findKanban(@Param('projectId') projectId: string) {
    return this.tasksService.findKanban(projectId);
  }

  @Get('gantt')
  findGantt(@Param('projectId') projectId: string) {
    return this.tasksService.findGantt(projectId);
  }

  @Get(':taskId')
  findOne(@Param('taskId') taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, req.user.id, dto);
  }

  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, req.user.id, dto);
  }

  @Patch(':taskId/move')
  moveTask(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body() body: { stepId: string | null; order: number },
  ) {
    return this.tasksService.moveTask(taskId, req.user.id, body.stepId, body.order);
  }

  @Delete(':taskId')
  remove(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.remove(taskId, req.user.id);
  }
}
