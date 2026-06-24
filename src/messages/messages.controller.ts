import {
  Controller, Get, Post, Body, Param, Req, UseGuards, Sse, MessageEvent,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { MessagesService } from './messages.service';
import { MessagesSseService } from './messages-sse.service';
import { SendMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserOrIpThrottlerGuard } from '../common/user-or-ip-throttler.guard';

@UseGuards(JwtAuthGuard, UserOrIpThrottlerGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private sseService: MessagesSseService,
  ) {}

  @Sse('events')
  events(@Req() req: any): Observable<MessageEvent> {
    return this.sseService.stream(req.user.id) as Observable<MessageEvent>;
  }

  @Get('conversations')
  conversations(@Req() req: any) {
    return this.messagesService.conversations(req.user.id);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.messagesService.unreadCount(req.user.id);
  }

  @Get('thread/:userId')
  thread(@Req() req: any, @Param('userId') userId: string) {
    return this.messagesService.thread(req.user.id, userId);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 메시지 전송: 분당 30건
  @Post()
  send(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.id, dto);
  }
}
