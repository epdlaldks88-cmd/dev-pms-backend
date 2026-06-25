import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationsSseService } from './notifications-sse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private sseService: NotificationsSseService,
  ) {}

  @Sse('events')
  events(@Req() req: any): Observable<any> {
    return this.sseService.stream(req.user.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(req.user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }
}
