import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkLogDto, UpdateWorkLogDto } from './dto/worklog.dto';

const WORKLOG_SELECT = {
  id: true,
  description: true,
  hours: true,
  workDate: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatar: true } },
  task: {
    select: {
      id: true,
      title: true,
      status: true,
      project: { select: { id: true, name: true, color: true } },
    },
  },
};

@Injectable()
export class WorkLogsService {
  constructor(private prisma: PrismaService) {}

  // 전체 워크로드 (담당자별 그룹핑은 프론트에서)
  findAll(query?: { userId?: string; projectId?: string }) {
    const where: any = {};
    if (query?.userId) where.userId = query.userId;
    if (query?.projectId) where.task = { projectId: query.projectId };
    return this.prisma.workLog.findMany({
      where,
      select: WORKLOG_SELECT,
      orderBy: { workDate: 'desc' },
    });
  }

  // 담당자별 집계 (총 공수)
  async summary() {
    const grouped = await this.prisma.workLog.groupBy({
      by: ['userId'],
      _sum: { hours: true },
      _count: true,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, avatar: true },
    });
    return grouped.map((g) => ({
      user: users.find((u) => u.id === g.userId),
      totalHours: g._sum.hours ?? 0,
      count: g._count,
    }));
  }

  create(currentUserId: string, dto: CreateWorkLogDto) {
    return this.prisma.workLog.create({
      data: {
        taskId: dto.taskId,
        userId: dto.userId || currentUserId,
        hours: dto.hours ?? 0,
        description: dto.description,
        workDate: dto.workDate ? new Date(dto.workDate) : new Date(),
      },
      select: WORKLOG_SELECT,
    });
  }

  update(id: string, dto: UpdateWorkLogDto) {
    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...(dto.hours !== undefined && { hours: dto.hours }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.workDate !== undefined && { workDate: dto.workDate ? new Date(dto.workDate) : undefined }),
      },
      select: WORKLOG_SELECT,
    });
  }

  async remove(id: string) {
    await this.prisma.workLog.delete({ where: { id } });
    return { message: '일감이 삭제되었습니다.' };
  }
}
