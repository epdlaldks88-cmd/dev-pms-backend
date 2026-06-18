import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SheetsService } from './sheets.service';

@Controller('projects/:projectId/sheets')
@UseGuards(JwtAuthGuard)
export class SheetsController {
  constructor(private readonly svc: SheetsService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.svc.list(projectId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Req() req: any, @Body('name') name: string) {
    return this.svc.create(projectId, req.user.id, name ?? '새 시트');
  }

  @Get(':sheetId')
  get(@Param('projectId') projectId: string, @Param('sheetId') sheetId: string) {
    return this.svc.get(projectId, sheetId);
  }

  @Put(':sheetId')
  save(@Param('projectId') projectId: string, @Param('sheetId') sheetId: string, @Body('data') data: any) {
    return this.svc.save(projectId, sheetId, data);
  }

  @Put(':sheetId/rename')
  rename(@Param('projectId') projectId: string, @Param('sheetId') sheetId: string, @Body('name') name: string) {
    return this.svc.rename(projectId, sheetId, name);
  }

  @Delete(':sheetId')
  remove(@Param('projectId') projectId: string, @Param('sheetId') sheetId: string) {
    return this.svc.remove(projectId, sheetId);
  }
}
