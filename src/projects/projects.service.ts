import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  color: true,
  icon: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, avatar: true } },
  members: {
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  },
  _count: { select: { tasks: true } },
};

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description || undefined,
        color: dto.color,
        icon: dto.icon,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: userId,
        members: { create: { userId, role: 'OWNER' } },
        steps: {
          createMany: {
            data: [
              { name: '할 일', order: 0, color: '#e2e8f0' },
              { name: '진행 중', order: 1, color: '#bfdbfe' },
              { name: '검토 중', order: 2, color: '#fde68a' },
              { name: '완료', order: 3, color: '#bbf7d0' },
            ],
          },
        },
      },
      select: PROJECT_SELECT,
    });

    await this.activityLogs.log({
      userId,
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      entityName: project.name,
      projectId: project.id,
    });

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      select: PROJECT_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(projectId: string, userId: string) {
    await this.checkMembership(projectId, userId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ...PROJECT_SELECT,
        steps: { orderBy: { order: 'asc' } },
      },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.checkAdminAccess(projectId, userId);

    const { startDate, endDate, ...rest } = dto;
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      select: PROJECT_SELECT,
    });

    await this.activityLogs.log({
      userId,
      action: 'UPDATED',
      entityType: 'PROJECT',
      entityId: project.id,
      entityName: project.name,
      projectId: project.id,
    });

    return project;
  }

  async remove(projectId: string, userId: string) {
    await this.checkOwnerAccess(projectId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: '프로젝트가 삭제되었습니다.' };
  }

  async addMember(projectId: string, userId: string, targetUserId: string, role = 'MEMBER') {
    await this.checkAdminAccess(projectId, userId);
    return this.prisma.projectMember.upsert({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      update: { role: role as any },
      create: { userId: targetUserId, projectId, role: role as any },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async removeMember(projectId: string, userId: string, targetUserId: string) {
    await this.checkAdminAccess(projectId, userId);
    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    return { message: '멤버가 제거되었습니다.' };
  }

  async getStats(projectId: string, userId: string) {
    await this.checkMembership(projectId, userId);

    const [total, byStatus, byPriority, overdue] = await Promise.all([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: true,
      }),
      this.prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
    ]);

    return { total, byStatus, byPriority, overdue };
  }

  async checkMembership(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (!member) throw new ForbiddenException('프로젝트에 접근 권한이 없습니다.');
    return member;
  }

  private async checkAdminAccess(projectId: string, userId: string) {
    const member = await this.checkMembership(projectId, userId);
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
  }

  private async checkOwnerAccess(projectId: string, userId: string) {
    const member = await this.checkMembership(projectId, userId);
    if (member.role !== 'OWNER') {
      throw new ForbiddenException('소유자 권한이 필요합니다.');
    }
  }
}
