import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: string, userId: string, file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    return this.prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url,
        taskId,
        uploadedById: userId,
      },
      select: {
        id: true, filename: true, originalName: true,
        mimetype: true, size: true, url: true, createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  }

  async remove(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException();

    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    return { message: '첨부파일이 삭제되었습니다.' };
  }
}
