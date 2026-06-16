import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Req() req: any,
    @Body('userId') targetUserId: string,
    @Body('role') role: string,
  ) {
    return this.projectsService.addMember(id, req.user.id, targetUserId, role);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    return this.projectsService.removeMember(id, req.user.id, memberId);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.getStats(id, req.user.id);
  }
}
