import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWorkLogDto, UpdateWorkLogDto } from './dto/worklog.dto';

const WORKLOG_SELECT = {
  id: true,
  description: true,
  requester: true,
  requestDate: true,
  hours: true,
  workDate: true,
  startDate: true,
  endDate: true,
  stage: true,
  isAcknowledged: true,
  acknowledgedAt: true,
  userConfirmedAt: true,
  createdAt: true,
  taskTitle: true,
  projectName: true,
  srNumber: true,
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
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll(query?: { userId?: string; projectId?: string; stage?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query?.userId) where.userId = query.userId;
    if (query?.stage) where.stage = query.stage;
    if (query?.startDate || query?.endDate) {
      where.OR = [
        {
          startDate: {
            ...(query.startDate && { gte: new Date(query.startDate) }),
            ...(query.endDate && { lte: new Date(query.endDate + 'T23:59:59') }),
          },
        },
        {
          workDate: {
            ...(query.startDate && { gte: new Date(query.startDate) }),
            ...(query.endDate && { lte: new Date(query.endDate + 'T23:59:59') }),
          },
        },
      ];
    }
    if (query?.projectId) {
      const projectFilter = [
        { task: { projectId: query.projectId } },
        { taskId: null, projectName: { not: null } },
      ];
      where.AND = [{ OR: projectFilter }];
    }
    return this.prisma.workLog.findMany({
      where,
      select: WORKLOG_SELECT,
      orderBy: [{ startDate: 'desc' }, { workDate: 'desc' }],
    });
  }

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

  private async generateSrNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `SR-${year}-`;
    const last = await this.prisma.workLog.findFirst({
      where: { srNumber: { startsWith: prefix } },
      orderBy: { srNumber: 'desc' },
      select: { srNumber: true },
    });
    const seq = last
      ? String(parseInt(last.srNumber!.split('-')[2]) + 1).padStart(4, '0')
      : '0001';
    return `${prefix}${seq}`;
  }

  async create(currentUserId: string, dto: CreateWorkLogDto) {
    let taskTitle: string | undefined;
    let projectName: string | undefined;

    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
        select: { title: true, project: { select: { name: true } } },
      });
      if (task) {
        taskTitle = task.title;
        projectName = task.project.name;
      }
    }

    const assignedUserId = dto.userId || currentUserId;
    const isSelf = assignedUserId === currentUserId;
    const srNumber = await this.generateSrNumber();

    const data: any = {
      userId: assignedUserId,
      hours: dto.hours ?? 0,
      description: dto.description,
      requester: dto.requester || null,
      requestDate: dto.requestDate ? new Date(dto.requestDate) : null,
      workDate: dto.startDate ? new Date(dto.startDate) : (dto.workDate ? new Date(dto.workDate) : new Date()),
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      taskTitle: taskTitle ?? null,
      projectName: projectName ?? null,
      srNumber,
      // 자기 자신에게 등록 시 자동 확인처리
      isAcknowledged: isSelf,
      acknowledgedAt: isSelf ? new Date() : null,
    };
    if (dto.taskId) data.taskId = dto.taskId;

    const created = await this.prisma.workLog.create({
      data,
      select: WORKLOG_SELECT,
    });

    // 다른 사람에게 할당된 경우 알림 발송
    if (!isSelf) {
      await this.notifications.create({
        userId: assignedUserId,
        type: 'TASK_ASSIGNED',
        title: '새 일감이 할당되었습니다',
        message: `"${taskTitle ?? '일감'}"에 대한 작업이 등록되었습니다. (${dto.hours ?? 0}h)`,
        link: '/workload',
      });
    }

    return created;
  }

  async update(id: string, dto: UpdateWorkLogDto, userId?: string, userRole?: string) {
    if (userId && userRole !== 'ADMIN') {
      const log = await this.prisma.workLog.findUnique({ where: { id }, select: { userId: true } });
      if (log && log.userId !== userId) {
        throw new ForbiddenException('일감 수정은 담당자 또는 관리자만 가능합니다.');
      }
    }
    const stageData: any = {};
    if (dto.stage !== undefined) {
      stageData.stage = dto.stage;
      if (dto.stage === 'USER_CONFIRMED') {
        stageData.userConfirmedAt = new Date();
      }
    }
    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...(dto.hours !== undefined && { hours: dto.hours }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.requester !== undefined && { requester: dto.requester || null }),
        ...(dto.requestDate !== undefined && { requestDate: dto.requestDate ? new Date(dto.requestDate) : null }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.workDate !== undefined && { workDate: dto.workDate ? new Date(dto.workDate) : undefined }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
        ...stageData,
      },
      select: WORKLOG_SELECT,
    });
  }

  acknowledge(id: string, userId: string) {
    return this.prisma.workLog.update({
      where: { id, userId },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
      },
      select: WORKLOG_SELECT,
    });
  }

  async resetAll() {
    await this.prisma.workLog.deleteMany({});
    return { message: '일감 전체 초기화 완료. SR 시퀀스도 리셋되었습니다.' };
  }

  async remove(id: string, userId?: string, userRole?: string) {
    if (userId && userRole !== 'ADMIN') {
      const log = await this.prisma.workLog.findUnique({ where: { id }, select: { userId: true } });
      if (log && log.userId !== userId) {
        throw new ForbiddenException('일감 삭제는 담당자 또는 관리자만 가능합니다.');
      }
    }
    await this.prisma.workLog.delete({ where: { id } });
    return { message: '일감이 삭제되었습니다.' };
  }
}
