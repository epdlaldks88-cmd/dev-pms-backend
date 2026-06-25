import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseService } from './notifications-sse.service';
import { DeviceTokensModule } from '../device-tokens/device-tokens.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DeviceTokensModule, ChatModule],
  providers: [NotificationsService, NotificationsSseService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsSseService],
})
export class NotificationsModule {}
