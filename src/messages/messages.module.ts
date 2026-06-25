import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesSseService } from './messages-sse.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ChatModule],
  providers: [MessagesService, MessagesSseService],
  controllers: [MessagesController],
})
export class MessagesModule {}
