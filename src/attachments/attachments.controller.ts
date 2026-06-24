import {
  Controller, Post, Delete, Param, Req,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// 업로드 허용 확장자 화이트리스트. .html/.svg/.js 등 브라우저에서 실행 가능한
// 형식은 제외해 저장형 XSS를 차단한다.
const ALLOWED_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.md', '.hwp', '.hwpx',
  '.zip', '.7z', '.rar',
]);

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(
      new BadRequestException(`허용되지 않는 파일 형식입니다: ${ext || '확장자 없음'}`),
      false,
    );
  }
  cb(null, true);
};

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
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter,
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
    return this.attachmentsService.remove(attachmentId, req.user.id, req.user.role);
  }
}
