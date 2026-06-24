import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWbsItemDto, UpdateWbsItemDto, ReorderWbsDto } from './wbs.dto';

@Injectable()
export class WbsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.wbsItem.findMany({
      where: { projectId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(projectId: string, dto: CreateWbsItemDto) {
    const count = await this.prisma.wbsItem.count({ where: { projectId } });
    return this.prisma.wbsItem.create({
      data: {
        title: dto.title,
        assignee: dto.assignee,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        progress: dto.progress ?? 0,
        note: dto.note,
        order: dto.order ?? count,
        depth: dto.depth ?? 0,
        projectId,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateWbsItemDto) {
    const item = await this.prisma.wbsItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    return this.prisma.wbsItem.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.assignee !== undefined && { assignee: dto.assignee || null }),
        ...('startDate' in dto && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...('endDate' in dto && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
        ...(dto.note !== undefined && { note: dto.note || null }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.depth !== undefined && { depth: dto.depth }),
        ...('parentId' in dto && { parentId: dto.parentId ?? null }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.wbsItem.delete({ where: { id } });
  }

  async reorder(projectId: string, dto: ReorderWbsDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.wbsItem.update({
          where: { id: item.id },
          data: { order: item.order, parentId: item.parentId, depth: item.depth },
        }),
      ),
    );
    return this.findAll(projectId);
  }
}
