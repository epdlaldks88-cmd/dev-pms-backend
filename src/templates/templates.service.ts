import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_SELECT = {
  id: true,
  title: true,
  phase: true,
  description: true,
  content: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, avatar: true } },
  files: {
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimetype: true,
      size: true,
      url: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  findAll(phase?: string) {
    return this.prisma.template.findMany({
      where: phase ? { phase } : undefined,
      orderBy: [{ phase: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
      select: TEMPLATE_SELECT,
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      select: TEMPLATE_SELECT,
    });
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    return template;
  }

  create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: { ...dto, createdById: userId },
      select: TEMPLATE_SELECT,
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);
    return this.prisma.template.update({
      where: { id },
      data: dto,
      select: TEMPLATE_SELECT,
    });
  }

  async remove(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { files: true },
    });
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');

    // 첨부파일 물리 삭제
    for (const f of template.files) {
      const filePath = path.join(process.cwd(), 'uploads', f.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await this.prisma.template.delete({ where: { id } });
    return { message: '템플릿이 삭제되었습니다.' };
  }

  async addFile(templateId: string, file: Express.Multer.File) {
    await this.findOne(templateId);
    return this.prisma.templateFile.create({
      data: {
        filename: file.filename,
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        templateId,
      },
      select: {
        id: true, filename: true, originalName: true,
        mimetype: true, size: true, url: true, createdAt: true,
      },
    });
  }

  // 템플릿 파일 다운로드: 로그인 사용자(전사 공유 자료)면 허용. 파일 경로/메타 반환.
  async getFileDownloadMeta(fileId: string) {
    const f = await this.prisma.templateFile.findUnique({ where: { id: fileId } });
    if (!f) throw new NotFoundException('파일을 찾을 수 없습니다.');

    const filePath = path.join(process.cwd(), 'uploads', f.filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('파일이 존재하지 않습니다.');

    return { filePath, mimetype: f.mimetype, originalName: f.originalName };
  }

  async removeFile(fileId: string) {
    const f = await this.prisma.templateFile.findUnique({ where: { id: fileId } });
    if (!f) throw new NotFoundException('파일을 찾을 수 없습니다.');

    const filePath = path.join(process.cwd(), 'uploads', f.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.prisma.templateFile.delete({ where: { id: fileId } });
    return { message: '파일이 삭제되었습니다.' };
  }
}
