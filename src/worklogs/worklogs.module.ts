import { Module } from '@nestjs/common';
import { WorkLogsService } from './worklogs.service';
import { WorkLogsController } from './worklogs.controller';

@Module({
  providers: [WorkLogsService],
  controllers: [WorkLogsController],
})
export class WorkLogsModule {}
