import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.label.findMany({ where: { projectId } });
  }

  async create(projectId: string, name: string, color: string) {
    return this.prisma.label.create({ data: { name, color, projectId } });
  }

  async update(labelId: string, name?: string, color?: string) {
    return this.prisma.label.update({
      where: { id: labelId },
      data: { ...(name && { name }), ...(color && { color }) },
    });
  }

  async remove(labelId: string) {
    await this.prisma.label.delete({ where: { id: labelId } });
    return { message: '라벨이 삭제되었습니다.' };
  }
}
