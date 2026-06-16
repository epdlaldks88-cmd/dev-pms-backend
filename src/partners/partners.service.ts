import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto, UpdatePartnerDto, CreatePersonnelDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  // ─── Partner ───

  findAll() {
    return this.prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { personnel: true } } },
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        personnel: {
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { tasks: true } } },
        },
      },
    });
    if (!partner) throw new NotFoundException('파트너사를 찾을 수 없습니다.');
    return partner;
  }

  create(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
  }

  update(id: string, dto: UpdatePartnerDto) {
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.partner.delete({ where: { id } });
    return { message: '파트너사가 삭제되었습니다.' };
  }

  // ─── Personnel ───

  addPersonnel(partnerId: string, dto: CreatePersonnelDto) {
    return this.prisma.personnel.create({ data: { ...dto, partnerId } });
  }

  updatePersonnel(personnelId: string, dto: CreatePersonnelDto) {
    return this.prisma.personnel.update({ where: { id: personnelId }, data: dto });
  }

  async removePersonnel(personnelId: string) {
    await this.prisma.personnel.delete({ where: { id: personnelId } });
    return { message: '인력이 삭제되었습니다.' };
  }

  // 전체 인력 (태스크 할당 셀렉트용)
  allPersonnel() {
    return this.prisma.personnel.findMany({
      orderBy: { name: 'asc' },
      include: { partner: { select: { id: true, name: true } } },
    });
  }
}
