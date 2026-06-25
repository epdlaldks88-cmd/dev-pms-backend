import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.issuesService.findAll(projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body() dto: CreateIssueDto,
  ) {
    return this.issuesService.create(projectId, req.user.id, dto);
  }

  @Patch(':issueId')
  update(@Param('issueId') issueId: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(issueId, dto);
  }

  @Delete(':issueId')
  remove(@Param('issueId') issueId: string) {
    return this.issuesService.remove(issueId);
  }
}
