import {
  Controller, Post, Delete, Param, Req,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/attachments')
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.create(taskId, req.user.id, file);
  }

  @Delete(':attachmentId')
  remove(@Param('attachmentId') attachmentId: string, @Req() req: any) {
    return this.attachmentsService.remove(attachmentId, req.user.id);
  }
}
