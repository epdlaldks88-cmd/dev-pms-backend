import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesAllController } from './issues-all.controller';
import { IssuesService } from './issues.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssuesController, IssuesAllController],
  providers: [IssuesService],
})
export class IssuesModule {}
