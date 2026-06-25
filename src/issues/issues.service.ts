import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';

const ISSUE_SELECT = {
  id: true,
  title: true,
  description: true,
  riskLevel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
  taskId: true,
  createdBy: { select: { id: true, name: true, avatar: true } },
  assignee: { select: { id: true, name: true, avatar: true } },
  task: { select: { id: true, title: true } },
};

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.issue.findMany({
      where: { projectId },
      select: ISSUE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForUser() {
    return this.prisma.issue.findMany({
      select: {
        ...ISSUE_SELECT,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, userId: string, dto: CreateIssueDto) {
    return this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        riskLevel: dto.riskLevel ?? 'MEDIUM',
        status: dto.status ?? 'OPEN',
        projectId,
        createdById: userId,
        assigneeId: dto.assigneeId ?? null,
        taskId: dto.taskId ?? null,
      },
      select: ISSUE_SELECT,
    });
  }

  async update(issueId: string, dto: UpdateIssueDto) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue) throw new NotFoundException('이슈를 찾을 수 없습니다.');

    return this.prisma.issue.update({
      where: { id: issueId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.riskLevel !== undefined && { riskLevel: dto.riskLevel }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.taskId !== undefined && { taskId: dto.taskId }),
      },
      select: ISSUE_SELECT,
    });
  }

  async remove(issueId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!issue) throw new NotFoundException('이슈를 찾을 수 없습니다.');
    await this.prisma.issue.delete({ where: { id: issueId } });
    return { message: '이슈가 삭제되었습니다.' };
  }
}
