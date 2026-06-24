import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsSseService } from './rooms-sse.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoomsService, RoomsSseService],
  controllers: [RoomsController],
})
export class RoomsModule {}
