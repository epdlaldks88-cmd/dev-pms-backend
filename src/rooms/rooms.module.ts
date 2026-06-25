import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomsSseService } from './rooms-sse.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsSseService],
})
export class RoomsModule {}
