import { Controller, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.commentsService.create(taskId, req.user.id, content, parentId);
  }

  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Req() req: any,
    @Body('content') content: string,
  ) {
    return this.commentsService.update(commentId, req.user.id, content);
  }

  @Delete(':commentId')
  remove(@Param('commentId') commentId: string, @Req() req: any) {
    return this.commentsService.remove(commentId, req.user.id);
  }
}
