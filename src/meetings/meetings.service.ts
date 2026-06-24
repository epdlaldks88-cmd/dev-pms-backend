import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

const MEETING_SELECT = {
  id: true,
  title: true,
  content: true,
  meetingDate: true,
  startTime: true,
  endTime: true,
  attendees: true,
  location: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, color: true } },
  createdBy: { select: { id: true, name: true, avatar: true } },
  participants: {
    select: { user: { select: { id: true, name: true, avatar: true, email: true } } },
  },
};

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

  async create(userId: string, dto: CreateMeetingDto) {
    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        content: dto.content,
        attendees: dto.attendees,
        location: dto.location || null,
        meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : new Date(),
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        projectId: dto.projectId || undefined,
        createdById: userId,
        participants: dto.participantIds?.length
          ? {
              createMany: {
                data: dto.participantIds.map((pid) => ({ userId: pid })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      select: MEETING_SELECT,
    });

    // 참석자에게 알림 전송 (본인 제외)
    const others = (dto.participantIds ?? []).filter((pid) => pid !== userId);
    if (others.length) {
      const dateStr = dto.meetingDate
        ? new Date(dto.meetingDate).toLocaleDateString('ko-KR')
        : '날짜 미정';
      await Promise.all(
        others.map((pid) =>
          this.notifications.create({
            userId: pid,
            type: 'TASK_ASSIGNED',
            title: '회의에 초대되었습니다',
            message: `"${meeting.title}" 회의에 참석자로 지정되었습니다. (${dateStr}${dto.startTime ? ' ' + dto.startTime : ''})`,
            link: '/meetings',
          }),
        ),
      );
    }

    return meeting;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateMeetingDto) {
    const existing = await this.prisma.meeting.findUnique({
      where: { id },
      select: { createdById: true, participants: { select: { userId: true } } },
    });
    if (!existing) throw new NotFoundException();
    if (userRole !== 'ADMIN' && existing.createdById !== userId) {
      throw new ForbiddenException('회의록 작성자 또는 관리자만 수정할 수 있습니다.');
    }

    const meeting = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.attendees !== undefined && { attendees: dto.attendees }),
        ...(dto.location !== undefined && { location: dto.location || null }),
        ...(dto.meetingDate !== undefined && { meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : undefined }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime || null }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime || null }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId || null }),
        ...(dto.participantIds !== undefined && {
          participants: {
            deleteMany: {},
            createMany: {
              data: dto.participantIds.map((pid) => ({ userId: pid })),
              skipDuplicates: true,
            },
          },
        }),
      },
      select: MEETING_SELECT,
    });

    // 새로 추가된 참석자에게만 알림 (기존 참석자·본인 제외)
    if (dto.participantIds !== undefined) {
      const prevIds = new Set(existing.participants.map((p) => p.userId));
      const added = dto.participantIds.filter((pid) => !prevIds.has(pid) && pid !== userId);
      if (added.length) {
        const dateStr = meeting.meetingDate
          ? new Date(meeting.meetingDate).toLocaleDateString('ko-KR')
          : '날짜 미정';
        await Promise.all(
          added.map((pid) =>
            this.notifications.create({
              userId: pid,
              type: 'TASK_ASSIGNED',
              title: '회의에 초대되었습니다',
              message: `"${meeting.title}" 회의에 참석자로 지정되었습니다. (${dateStr}${meeting.startTime ? ' ' + meeting.startTime : ''})`,
              link: '/meetings',
            }),
          ),
        );
      }
    }

    return meeting;
  }

  async remove(id: string, userId: string, userRole: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException();
    if (userRole !== 'ADMIN' && meeting.createdById !== userId) {
      throw new ForbiddenException('회의록 작성자 또는 관리자만 삭제할 수 있습니다.');
    }
    await this.prisma.meeting.delete({ where: { id } });
    return { message: '회의록이 삭제되었습니다.' };
  }
}
