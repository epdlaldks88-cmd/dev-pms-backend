import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Get()
  findAll(@Query() query: { projectId?: string }) {
    return this.meetingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.remove(id, req.user.id);
  }
}
