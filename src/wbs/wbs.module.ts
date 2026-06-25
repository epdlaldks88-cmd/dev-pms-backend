import { Module } from '@nestjs/common';
import { WbsController } from './wbs.controller';
import { WbsService } from './wbs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WbsController],
  providers: [WbsService],
})
export class WbsModule {}
