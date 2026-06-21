import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, Sse } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserOrIpThrottlerGuard } from '../common/user-or-ip-throttler.guard';
import { RoomsService } from './rooms.service';
import { RoomsSseService } from './rooms-sse.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, UserOrIpThrottlerGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private sseService: RoomsSseService,
    private prisma: PrismaService,
  ) {}

  // 내 룸 목록
  @Get()
  myRooms(@Req() req: any) {
    return this.roomsService.myRooms(req.user.id);
  }

  // 룸 생성
  @Post()
  create(@Req() req: any, @Body() body: { name: string; memberIds: string[] }) {
    return this.roomsService.create(req.user.id, body.name, body.memberIds ?? []);
  }

  // 룸 메시지 조회
  @Get(':roomId/messages')
  messages(@Param('roomId') roomId: string, @Req() req: any) {
    return this.roomsService.messages(roomId, req.user.id);
  }

  // 메시지 전송
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 분당 30건
  @Post(':roomId/messages')
  async send(@Param('roomId') roomId: string, @Req() req: any, @Body('content') content: string) {
    const msg = await this.roomsService.send(roomId, req.user.id, content);
    this.sseService.emit({
      roomId,
      senderId: req.user.id,
      senderName: msg.sender.name,
      content: msg.content, // 저장된 sanitized 내용으로 전파
    });
    return msg;
  }

  // 멤버 추가
  @Post(':roomId/members')
  addMember(@Param('roomId') roomId: string, @Req() req: any, @Body('userId') userId: string) {
    return this.roomsService.addMember(roomId, req.user.id, userId);
  }

  // 룸 이름 변경
  @Patch(':roomId/name')
  rename(@Param('roomId') roomId: string, @Req() req: any, @Body('name') name: string) {
    return this.roomsService.rename(roomId, req.user.id, name);
  }

  // 룸 나가기
  @Delete(':roomId/members/me')
  leave(@Param('roomId') roomId: string, @Req() req: any) {
    return this.roomsService.leave(roomId, req.user.id);
  }

  // SSE — 내가 속한 룸들의 실시간 이벤트
  // 컨트롤러의 JwtAuthGuard가 적용됨(JWT 전략이 ?token= 쿼리도 서명 검증 후 처리).
  // 과거엔 서명 검증 없이 토큰 payload를 신뢰해 위조 토큰으로 타인 룸 구독이 가능했음 → 제거.
  @Sse('events')
  async events(@Req() req: any): Promise<Observable<any>> {
    const userId = req.user.id;
    const members = await this.prisma.roomMember.findMany({
      where: { userId },
      select: { roomId: true },
    });
    const roomIds = members.map((m) => m.roomId);
    return this.sseService.stream(userId, roomIds) as Observable<any>;
  }
}
