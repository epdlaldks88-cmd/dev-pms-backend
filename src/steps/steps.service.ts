import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';

@Injectable()
export class StepsService {
  constructor(private prisma: PrismaService) {}

  private async assertManager(stepId: string, userId: string) {
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (!step) throw new NotFoundException('단계를 찾을 수 없습니다.');
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: step.projectId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('단계 삭제는 오너 또는 관리자만 가능합니다.');
    }
  }

  async findAll(projectId: string) {
    return this.prisma.step.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async create(projectId: string, dto: CreateStepDto) {
    const lastStep = await this.prisma.step.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });
    return this.prisma.step.create({
      data: {
        ...dto,
        order: dto.order ?? (lastStep ? lastStep.order + 1 : 0),
        projectId,
      },
    });
  }

  async update(stepId: string, dto: Partial<CreateStepDto>) {
    const step = await this.prisma.step.update({ where: { id: stepId }, data: dto });
    // 컬럼 상태를 바꾸면 그 컬럼에 들어있는 태스크들의 status도 함께 맞춘다
    if (dto.status) {
      await this.prisma.task.updateMany({
        where: { stepId },
        data: { status: dto.status },
      });
    }
    return step;
  }

  async reorder(projectId: string, orders: { id: string; order: number }[]) {
    await Promise.all(
      orders.map(({ id, order }) =>
        this.prisma.step.update({ where: { id }, data: { order } }),
      ),
    );
    return this.findAll(projectId);
  }

  async remove(stepId: string, userId: string) {
    await this.assertManager(stepId, userId);
    await this.prisma.task.deleteMany({ where: { stepId } });
    await this.prisma.step.delete({ where: { id: stepId } });
    return { message: '단계가 삭제되었습니다.' };
  }
}
