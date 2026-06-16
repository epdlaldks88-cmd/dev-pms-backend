import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { WorkLogsService } from './worklogs.service';
import { CreateWorkLogDto, UpdateWorkLogDto } from './dto/worklog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('worklogs')
export class WorkLogsController {
  constructor(private workLogsService: WorkLogsService) {}

  @Get()
  findAll(@Query() query: { userId?: string; projectId?: string }) {
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
  update(@Param('id') id: string, @Body() dto: UpdateWorkLogDto) {
    return this.workLogsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workLogsService.remove(id);
  }
}
