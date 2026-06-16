import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAction } from '@prisma/client';

interface LogDto {
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityName: string;
  projectId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(dto: LogDto) {
    return this.prisma.activityLog.create({ data: dto });
  }

  async findByProject(projectId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        entityName: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityName: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }
}
