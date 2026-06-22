import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { DeviceTokensService } from '../device-tokens/device-tokens.service';

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
  ) {}

  async create(dto: CreateNotificationDto) {
    // 1. DB에 알림 저장 (기존 로직 유지)
    const notification = await this.prisma.notification.create({ data: dto });

    // 2. FCM 푸시 발송 (앱이 백그라운드/종료 상태일 때 수신)
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
