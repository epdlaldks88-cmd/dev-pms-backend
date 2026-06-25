import { Controller, Get, UseGuards } from '@nestjs/common';
import { WbsService } from './wbs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wbs')
export class WbsAllController {
  constructor(private readonly wbsService: WbsService) {}

  @Get()
  findAll() {
    return this.wbsService.findAllForUser();
  }
}
