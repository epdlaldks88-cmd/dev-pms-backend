import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { WorkLogsService } from './worklogs.service';
import { CreateWorkLogDto, UpdateWorkLogDto } from './dto/worklog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('worklogs')
export class WorkLogsController {
  constructor(private workLogsService: WorkLogsService) {}

  @Get()
  findAll(@Query() query: { userId?: string; projectId?: string; stage?: string; startDate?: string; endDate?: string }) {
    return this.workLogsService.findAll(query);
  }

  @Get('summary')
  summary() {
    return this.workLogsService.summary();
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkLogDto) {
    return this.workLogsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateWorkLogDto) {
    return this.workLogsService.update(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Req() req: any) {
    return this.workLogsService.acknowledge(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.workLogsService.remove(id, req.user.id, req.user.role);
  }

  @Delete()
  resetAll(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('관리자만 초기화할 수 있습니다.');
    return this.workLogsService.resetAll();
  }
}
