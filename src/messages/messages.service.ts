import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesSseService } from './messages-sse.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SendMessageDto } from './dto/message.dto';
import { stripHtmlTags } from '../common/sanitize.util';

const USER_MINI = { select: { id: true, name: true, avatar: true } };
const MESSAGE_SELECT = {
  id: true,
  content: true,
  isRead: true,
  createdAt: true,
  senderId: true,
  recipientId: true,
  sender: USER_MINI,
  recipient: USER_MINI,
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private sseService: MessagesSseService,
    private chatGateway: ChatGateway,
  ) {}

  async conversations(userId: string) {
    const msgs = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      select: MESSAGE_SELECT,
    });

    const map = new Map<string, any>();
    for (const m of msgs) {
      const isMine = m.senderId === userId;
      const otherId = isMine ? m.recipientId : m.senderId;
      const other = isMine ? m.recipient : m.sender;
      if (!map.has(otherId)) {
        map.set(otherId, { user: other, lastMessage: m, unread: 0 });
      }
      if (m.recipientId === userId && !m.isRead) {
        map.get(otherId).unread += 1;
      }
    }
    return Array.from(map.values());
  }

  async thread(userId: string, otherId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: otherId },
      select: {
        id: true,
        name: true,
        avatar: true,
        position: true,
        department: true,
      },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: MESSAGE_SELECT,
    });

    await this.prisma.message.updateMany({
      where: { senderId: otherId, recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    return { user, messages };
  }

  async send(senderId: string, dto: SendMessageDto) {
    if (dto.recipientId === senderId) {
      throw new BadRequestException('자기 자신에게는 보낼 수 없습니다.');
    }

    const content = stripHtmlTags(dto.content);

    const message = await this.prisma.message.create({
      data: { content, senderId, recipientId: dto.recipientId },
      select: MESSAGE_SELECT,
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    // WebSocket으로 수신자에게 실시간 전송
    this.chatGateway.emitDirectMessage(dto.recipientId, message);

    // SSE (기존 유지)
    this.sseService.emit({
      recipientId: dto.recipientId,
      senderId,
      senderName: sender?.name ?? '누군가',
    });

    const preview =
      content.length > 100 ? `${content.slice(0, 100)}…` : content;
    await this.notifications.create({
      userId: dto.recipientId,
      type: 'MENTION',
      title: `${sender?.name ?? '누군가'}님`,
      message: preview,
      link: `/messages?to=${senderId}`,
    });

    return message;
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }
}
