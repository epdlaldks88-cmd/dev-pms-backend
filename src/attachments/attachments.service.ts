import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: string, userId: string, file: Express.Multer.File) {
    // 권한 검증 실패 시 디스크에 이미 저장된 업로드 파일을 정리한다.
    const cleanup = () => {
      try {
        fs.unlinkSync(path.join(process.cwd(), 'uploads', file.filename));
      } catch {
        /* 파일이 없으면 무시 */
      }
    };

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) {
      cleanup();
      throw new NotFoundException('태스크를 찾을 수 없습니다.');
    }

    // 해당 프로젝트의 멤버만 업로드 가능
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: task.projectId } },
    });
    if (!member) {
      cleanup();
      throw new ForbiddenException('해당 프로젝트의 멤버가 아닙니다.');
    }

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

  // 다운로드: 프로젝트 멤버(또는 시스템 관리자)만 허용. 파일 경로/메타 반환.
  async getDownloadMeta(attachmentId: string, userId: string, userRole?: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: { select: { projectId: true } } },
    });
    if (!attachment) throw new NotFoundException();

    if (userRole !== 'ADMIN') {
      const member = await this.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: attachment.task.projectId } },
      });
      if (!member) throw new ForbiddenException('해당 프로젝트의 멤버가 아닙니다.');
    }

    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('파일이 존재하지 않습니다.');

    return { filePath, mimetype: attachment.mimetype, originalName: attachment.originalName };
  }

  async remove(attachmentId: string, userId: string, userRole?: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: { select: { projectId: true } } },
    });
    if (!attachment) throw new NotFoundException();

    // 삭제 권한: 업로더 본인 / 시스템 관리자 / 프로젝트 OWNER·ADMIN
    const isUploader = attachment.uploadedById === userId;
    const isSysAdmin = userRole === 'ADMIN';
    let isProjectAdmin = false;
    if (!isUploader && !isSysAdmin) {
      const member = await this.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: attachment.task.projectId } },
      });
      isProjectAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';
    }
    if (!isUploader && !isSysAdmin && !isProjectAdmin) {
      throw new ForbiddenException('첨부파일을 삭제할 권한이 없습니다.');
    }

    const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    return { message: '첨부파일이 삭제되었습니다.' };
  }
}
