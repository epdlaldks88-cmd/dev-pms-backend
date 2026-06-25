import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { DeviceTokensService } from '../device-tokens/device-tokens.service';
import { NotificationsSseService } from './notifications-sse.service';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
    private deviceTokensService: DeviceTokensService,
    private sseService: NotificationsSseService,
  ) {}

  async create(dto: CreateNotificationDto) {
    // 1. DB에 알림 저장
    const notification = await this.prisma.notification.create({ data: dto });

    // 2. SSE로 실시간 전송
    this.sseService.emit({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
    });

    // 3. FCM 푸시 발송
    const tokens = await this.deviceTokensService.getTokensByUserId(dto.userId);
    if (tokens.length > 0) {
      await this.firebaseService.sendPushToMultiple(
        tokens,
        dto.title,
        dto.message,
        {
          type: dto.type,
          link: dto.link || '',
          notificationId: notification.id,
        },
      );
    }

    return notification;
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: '모든 알림을 읽음 처리했습니다.' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
