import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/steps')
export class StepsController {
  constructor(private stepsService: StepsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.stepsService.findAll(projectId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateStepDto) {
    return this.stepsService.create(projectId, dto);
  }

  @Patch('reorder')
  reorder(
    @Param('projectId') projectId: string,
    @Body() body: { orders: { id: string; order: number }[] },
  ) {
    return this.stepsService.reorder(projectId, body.orders);
  }

  @Patch(':stepId')
  update(@Param('stepId') stepId: string, @Body() dto: Partial<CreateStepDto>) {
    return this.stepsService.update(stepId, dto);
  }

  @Delete(':stepId')
  remove(@Param('stepId') stepId: string, @Req() req: any) {
    return this.stepsService.remove(stepId, req.user.id);
  }
}
