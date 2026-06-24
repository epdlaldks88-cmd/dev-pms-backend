import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { AttachmentDownloadController } from './attachment-download.controller';

@Module({
  providers: [AttachmentsService],
  controllers: [AttachmentsController, AttachmentDownloadController],
})
export class AttachmentsModule {}
