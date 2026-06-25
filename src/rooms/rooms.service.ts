import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stripHtmlTags } from '../common/sanitize.util';
import { ChatGateway } from '../chat/chat.gateway';

const USER_MINI = { select: { id: true, name: true, avatar: true } };

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  // 내가 속한 룸 목록
  async myRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: USER_MINI } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: USER_MINI },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      members: r.members.map((m) => m.user),
      lastMessage: r.messages[0] ?? null,
      updatedAt: r.updatedAt,
    }));
  }

  // 룸 생성
  async create(userId: string, name: string, memberIds: string[]) {
    const allMemberIds = [...new Set([userId, ...memberIds])];
    const room = await this.prisma.room.create({
      data: {
        name,
        createdById: userId,
        members: {
          createMany: { data: allMemberIds.map((id) => ({ userId: id })) },
        },
      },
      include: { members: { include: { user: USER_MINI } } },
    });
    return room;
  }

  // 룸 메시지 조회
  async messages(roomId: string, userId: string) {
    await this.assertMember(roomId, userId);
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { members: { include: { user: USER_MINI } } },
    });
    const messages = await this.prisma.roomMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: { sender: USER_MINI },
    });
    return { room, messages };
  }

  // 메시지 전송
  async send(roomId: string, userId: string, content: string) {
    await this.assertMember(roomId, userId);
    const clean = stripHtmlTags(content);
    const msg = await this.prisma.roomMessage.create({
      data: { roomId, senderId: userId, content: clean },
      include: { sender: USER_MINI },
    });
    await this.prisma.room.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // WebSocket으로 실시간 브로드캐스트
    this.chatGateway.emitRoomMessage(roomId, msg);

    return msg;
  }

  // 멤버 추가
  async addMember(roomId: string, requesterId: string, targetUserId: string) {
    await this.assertMember(roomId, requesterId);
    await this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      create: { roomId, userId: targetUserId },
      update: {},
    });
    return { ok: true };
  }

  // 룸 이름 변경
  async rename(roomId: string, userId: string, name: string) {
    await this.assertMember(roomId, userId);
    return this.prisma.room.update({ where: { id: roomId }, data: { name } });
  }

  // 룸 나가기
  async leave(roomId: string, userId: string) {
    await this.prisma.roomMember.deleteMany({ where: { roomId, userId } });
    const remaining = await this.prisma.roomMember.count({ where: { roomId } });
    if (remaining === 0)
      await this.prisma.room.delete({ where: { id: roomId } });
    return { ok: true };
  }

  private async assertMember(roomId: string, userId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new ForbiddenException('해당 채팅방의 멤버가 아닙니다.');
  }
}
