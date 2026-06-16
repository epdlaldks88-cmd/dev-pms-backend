import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(taskId: string, userId: string, content: string, parentId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true, createdBy: true },
    });
    if (!task) throw new NotFoundException();

    const comment = await this.prisma.comment.create({
      data: { content, taskId, authorId: userId, parentId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    const notifyIds = new Set([
      task.createdById,
      ...task.assignees.map((a) => a.userId),
    ]);
    notifyIds.delete(userId);

    await Promise.all(
      Array.from(notifyIds).map((id) =>
        this.notifications.create({
          userId: id,
          type: 'COMMENT_ADDED',
          title: '새 댓글이 작성되었습니다',
          message: `"${task.title}"에 새 댓글이 작성되었습니다.`,
          link: `/tasks/${taskId}`,
        }),
      ),
    );

    return comment;
  }

  async update(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new ForbiddenException();

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      select: {
        id: true, content: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException();
    if (comment.authorId !== userId) throw new ForbiddenException();

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: '댓글이 삭제되었습니다.' };
  }
}
