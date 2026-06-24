import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { streamFileToResponse } from '../common/file-stream.util';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentDownloadController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Get(':id/download')
  async download(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const meta = await this.attachmentsService.getDownloadMeta(id, req.user.id, req.user.role);
    streamFileToResponse(res, meta.filePath, meta.mimetype, meta.originalName);
  }
}
