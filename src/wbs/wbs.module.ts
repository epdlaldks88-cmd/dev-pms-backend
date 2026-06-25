import { Module } from '@nestjs/common';
import { WbsController } from './wbs.controller';
import { WbsAllController } from './wbs-all.controller';
import { WbsService } from './wbs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WbsController, WbsAllController],
  providers: [WbsService],
})
export class WbsModule {}
