import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceTokensService {
  private readonly logger = new Logger(DeviceTokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, token: string, platform: string) {
    // 이미 존재하면 업데이트, 없으면 생성 (upsert)
    const deviceToken = await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });
    this.logger.log(
      `디바이스 토큰 등록: userId=${userId}, platform=${platform}`,
    );
    return deviceToken;
  }

  async remove(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({
      where: { token, userId },
    });
    this.logger.log(`디바이스 토큰 삭제: userId=${userId}`);
    return { success: true };
  }

  async getTokensByUserId(userId: string): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  }

  async getTokensByUserIds(userIds: string[]): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  }
}
