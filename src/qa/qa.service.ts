import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQATestDto, UpdateQATestDto } from './dto/qa.dto';

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

  async findAll(srNumber?: string) {
    return this.prisma.qATest.findMany({
      where: srNumber ? { srNumber } : undefined,
      include: { workLog: { select: { id: true, taskTitle: true, srNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.qATest.findUniqueOrThrow({
      where: { id },
      include: { workLog: { select: { id: true, taskTitle: true, srNumber: true } } },
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
      data: { qaNumber, status: 'IN_PROGRESS' },
    });
  }

  // 확인(PASS) / 반려(REJECTED) / 취소(CANCELLED)
  async changeStatus(id: string, action: 'confirm' | 'reject' | 'cancel') {
    const qa = await this.prisma.qATest.findUnique({ where: { id } });
    if (!qa) throw new NotFoundException('QA 테스트를 찾을 수 없습니다.');

    const updateMap = {
      confirm: { status: 'COMPLETED' as const, result: 'PASS' as const },
      reject:  { status: 'COMPLETED' as const, result: 'REJECTED' as const },
      cancel:  { status: 'CANCELLED' as const },
    };

    return this.prisma.qATest.update({
      where: { id },
      data: updateMap[action],
    });
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
