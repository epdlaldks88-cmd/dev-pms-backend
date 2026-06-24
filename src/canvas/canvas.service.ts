import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface CanvasEvent { projectId: string; canvasId: string; actorId: string; type: string; }

@Injectable()
export class CanvasService {
  private subject = new Subject<CanvasEvent>();

  constructor(private prisma: PrismaService) {}

  async list(projectId: string) {
    return this.prisma.canvas.findMany({
      where: { projectId },
      select: { id: true, name: true, createdAt: true, updatedAt: true, createdBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(projectId: string, userId: string, name: string) {
    return this.prisma.canvas.create({
      data: { projectId, createdById: userId, name },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async get(projectId: string, canvasId: string) {
    const canvas = await this.prisma.canvas.findFirst({ where: { id: canvasId, projectId } });
    if (!canvas) throw new NotFoundException('캔버스를 찾을 수 없습니다.');
    return canvas;
  }

  async save(projectId: string, canvasId: string, userId: string, data: any) {
    const canvas = await this.prisma.canvas.findFirst({ where: { id: canvasId, projectId } });
    if (!canvas) throw new NotFoundException('캔버스를 찾을 수 없습니다.');
    const updated = await this.prisma.canvas.update({ where: { id: canvasId }, data: { data } });
    this.subject.next({ projectId, canvasId, actorId: userId, type: 'updated' });
    return updated;
  }

  // 이름변경·삭제는 등록자 또는 관리자만 가능
  private async assertOwnerOrAdmin(canvasId: string, userId: string, userRole?: string) {
    const canvas = await this.prisma.canvas.findUnique({ where: { id: canvasId }, select: { createdById: true } });
    if (!canvas) throw new NotFoundException('캔버스를 찾을 수 없습니다.');
    if (userRole !== 'ADMIN' && canvas.createdById !== userId) {
      throw new ForbiddenException('등록자 또는 관리자만 가능합니다.');
    }
  }

  async rename(projectId: string, canvasId: string, name: string, userId: string, userRole?: string) {
    await this.assertOwnerOrAdmin(canvasId, userId, userRole);
    return this.prisma.canvas.update({ where: { id: canvasId }, data: { name } });
  }

  async remove(projectId: string, canvasId: string, userId: string, userRole?: string) {
    await this.assertOwnerOrAdmin(canvasId, userId, userRole);
    await this.prisma.canvas.deleteMany({ where: { id: canvasId, projectId } });
  }

  async listComments(canvasId: string) {
    return this.prisma.canvasComment.findMany({
      where: { canvasId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async addComment(canvasId: string, userId: string, content: string) {
    const comment = await this.prisma.canvasComment.create({
      data: { canvasId, userId, content },
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    // 캔버스의 projectId 조회 후 SSE 브로드캐스트
    const canvas = await this.prisma.canvas.findUnique({ where: { id: canvasId }, select: { projectId: true } });
    if (canvas) this.subject.next({ projectId: canvas.projectId, canvasId, actorId: userId, type: 'comment' });
    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    await this.prisma.canvasComment.deleteMany({ where: { id: commentId, userId } });
  }

  stream(projectId: string, canvasId: string, userId: string) {
    return this.subject.pipe(
      filter((e) => e.projectId === projectId && e.canvasId === canvasId && e.actorId !== userId),
      map((e) => ({ data: { type: e.type } })),
    );
  }
}
