import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQATestDto, UpdateQATestDto } from './dto/qa.dto';

const WORKLOG_SELECT = {
  id: true, taskTitle: true, srNumber: true, projectName: true,
  requester: true, requestDate: true, startDate: true, endDate: true,
  stage: true, hours: true, description: true,
  user: { select: { id: true, name: true } },
} as const;

@Injectable()
export class QAService {
  constructor(private prisma: PrismaService) {}

  private async generateQANumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `QA-${year}-`;

    const last = await this.prisma.qATest.findFirst({
      where: { qaNumber: { startsWith: prefix } },
      orderBy: { qaNumber: 'desc' },
      select: { qaNumber: true },
    });

    const seq = last
      ? String(parseInt(last.qaNumber!.split('-')[2]) + 1).padStart(4, '0')
      : '0001';

    return `${prefix}${seq}`;
  }

  async findAll(filter?: { srNumber?: string; workLogId?: string }) {
    const where: any = {};
    if (filter?.srNumber) where.srNumber = filter.srNumber;
    if (filter?.workLogId) where.workLogId = filter.workLogId;
    return this.prisma.qATest.findMany({
      where,
      include: { workLog: { select: WORKLOG_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.qATest.findUniqueOrThrow({
      where: { id },
      include: { workLog: { select: WORKLOG_SELECT } },
    });
  }

  // QA요청: qaNumber 없이 PENDING 상태로 생성
  async create(dto: CreateQATestDto) {
    return this.prisma.qATest.create({
      data: {
        srNumber: dto.srNumber,
        title: dto.title,
        content: dto.content,
        tester: dto.tester,
        workLogId: dto.workLogId,
        status: 'PENDING',
      },
    });
  }

  // 접수: qaNumber 채번 + 상태 IN_PROGRESS로 변경
  async accept(id: string) {
    const qa = await this.prisma.qATest.findUnique({ where: { id } });
    if (!qa) throw new NotFoundException('QA 테스트를 찾을 수 없습니다.');
    if (qa.status !== 'PENDING') throw new BadRequestException('요청 상태인 항목만 접수할 수 있습니다.');

    const qaNumber = await this.generateQANumber();
    return this.prisma.qATest.update({
      where: { id },
      data: { qaNumber, status: 'IN_PROGRESS', acceptedAt: new Date() },
    });
  }

  // 확인(PASS) / 반려(REJECTED) / 취소(CANCELLED) / 되돌리기(reopen → IN_PROGRESS)
  async changeStatus(id: string, action: 'confirm' | 'reject' | 'cancel' | 'reopen') {
    const qa = await this.prisma.qATest.findUnique({ where: { id } });
    if (!qa) throw new NotFoundException('QA 테스트를 찾을 수 없습니다.');

    const data: any = {};
    if (action === 'confirm') { data.status = 'COMPLETED'; data.result = 'PASS'; data.completedAt = new Date(); }
    else if (action === 'reject') { data.status = 'COMPLETED'; data.result = 'REJECTED'; data.completedAt = new Date(); }
    else if (action === 'cancel') { data.status = 'CANCELLED'; }
    else if (action === 'reopen') { data.status = 'IN_PROGRESS'; data.result = null; data.completedAt = null; }

    return this.prisma.qATest.update({ where: { id }, data });
  }

  async update(id: string, dto: UpdateQATestDto) {
    return this.prisma.qATest.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.tester !== undefined && { tester: dto.tester }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.qATest.delete({ where: { id } });
  }
}
