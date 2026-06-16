import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

const MEETING_SELECT = {
  id: true,
  title: true,
  content: true,
  meetingDate: true,
  attendees: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, color: true } },
  createdBy: { select: { id: true, name: true, avatar: true } },
};

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: { projectId?: string }) {
    const where: any = {};
    if (query?.projectId) where.projectId = query.projectId;
    return this.prisma.meeting.findMany({
      where,
      select: MEETING_SELECT,
      orderBy: { meetingDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      select: MEETING_SELECT,
    });
    if (!meeting) throw new NotFoundException('회의록을 찾을 수 없습니다.');
    return meeting;
  }

  create(userId: string, dto: CreateMeetingDto) {
    return this.prisma.meeting.create({
      data: {
        title: dto.title,
        content: dto.content,
        attendees: dto.attendees,
        meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : new Date(),
        projectId: dto.projectId || undefined,
        createdById: userId,
      },
      select: MEETING_SELECT,
    });
  }

  update(id: string, dto: UpdateMeetingDto) {
    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.attendees !== undefined && { attendees: dto.attendees }),
        ...(dto.meetingDate !== undefined && { meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : undefined }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId || null }),
      },
      select: MEETING_SELECT,
    });
  }

  async remove(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException();
    if (meeting.createdById !== userId) {
      throw new ForbiddenException('회의록 작성자만 삭제할 수 있습니다.');
    }
    await this.prisma.meeting.delete({ where: { id } });
    return { message: '회의록이 삭제되었습니다.' };
  }
}
