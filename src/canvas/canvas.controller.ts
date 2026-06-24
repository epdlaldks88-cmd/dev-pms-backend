import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, Sse, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CanvasService } from './canvas.service';
import { Observable } from 'rxjs';

@Controller('projects/:projectId/canvases')
@UseGuards(JwtAuthGuard)
export class CanvasController {
  constructor(private readonly svc: CanvasService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.svc.list(projectId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Req() req: any, @Body('name') name: string) {
    return this.svc.create(projectId, req.user.id, name ?? '새 캔버스');
  }

  @Get(':canvasId')
  get(@Param('projectId') projectId: string, @Param('canvasId') canvasId: string) {
    return this.svc.get(projectId, canvasId);
  }

  @Put(':canvasId')
  save(@Param('projectId') projectId: string, @Param('canvasId') canvasId: string, @Req() req: any, @Body('data') data: any) {
    return this.svc.save(projectId, canvasId, req.user.id, data);
  }

  @Put(':canvasId/rename')
  rename(@Req() req: any, @Param('projectId') projectId: string, @Param('canvasId') canvasId: string, @Body('name') name: string) {
    return this.svc.rename(projectId, canvasId, name, req.user.id, req.user.role);
  }

  @Delete(':canvasId')
  remove(@Req() req: any, @Param('projectId') projectId: string, @Param('canvasId') canvasId: string) {
    return this.svc.remove(projectId, canvasId, req.user.id, req.user.role);
  }

  // ── 댓글 ───────────────────────────────────────────
  @Get(':canvasId/comments')
  listComments(@Param('canvasId') canvasId: string) {
    return this.svc.listComments(canvasId);
  }

  @Post(':canvasId/comments')
  addComment(@Param('canvasId') canvasId: string, @Req() req: any, @Body('content') content: string) {
    return this.svc.addComment(canvasId, req.user.id, content);
  }

  @Delete(':canvasId/comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.svc.deleteComment(commentId, req.user.id);
  }

  @Sse(':canvasId/events')
  @UseGuards()
  events(@Param('projectId') projectId: string, @Param('canvasId') canvasId: string, @Query('token') token: string): Observable<any> {
    let userId = 'anonymous';
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch {}
    return this.svc.stream(projectId, canvasId, userId);
  }
}
