import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/labels')
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.labelsService.findAll(projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body('name') name: string,
    @Body('color') color: string,
  ) {
    return this.labelsService.create(projectId, name, color);
  }

  @Patch(':labelId')
  update(
    @Param('labelId') labelId: string,
    @Body('name') name?: string,
    @Body('color') color?: string,
  ) {
    return this.labelsService.update(labelId, name, color);
  }

  @Delete(':labelId')
  remove(@Param('labelId') labelId: string) {
    return this.labelsService.remove(labelId);
  }
}
