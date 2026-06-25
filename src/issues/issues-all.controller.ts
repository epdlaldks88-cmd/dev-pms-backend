import { Controller, Get, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesAllController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  findAll() {
    return this.issuesService.findAllForUser();
  }
}
