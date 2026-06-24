import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, Res,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { streamFileToResponse } from '../common/file-stream.util';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('phase') phase?: string) {
    return this.templatesService.findAll(phase);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.templatesService.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  addFile(@Req() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.templatesService.addFile(id, file, req.user.id, req.user.role);
  }

  @Get('files/:fileId/download')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const meta = await this.templatesService.getFileDownloadMeta(fileId);
    streamFileToResponse(res, meta.filePath, meta.mimetype, meta.originalName);
  }

  @Delete('files/:fileId')
  removeFile(@Req() req: any, @Param('fileId') fileId: string) {
    return this.templatesService.removeFile(fileId, req.user.id, req.user.role);
  }
}
