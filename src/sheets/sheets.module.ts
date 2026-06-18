import { Module } from '@nestjs/common';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SheetsController],
  providers: [SheetsService],
})
export class SheetsModule {}
