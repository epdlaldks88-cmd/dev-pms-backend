import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  requester: true,
  part: true,
  priority: true,
  status: true,
  startDate: true,
  dueDate: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
  stepId: true,
  parentId: true,
  step: { select: { id: true, name: true, color: true } },
  createdBy: { select: { id: true, name: true, avatar: true } },
  assignees: {
    select: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
    },
  },
  labels: {
    select: { label: { select: { id: true, name: true, color: true } } },
  },
  personnel: {
    select: {
      personnel: {
        select: {
          id: true,
          name: true,
          position: true,
          partner: { select: { id: true, name: true } },
        },
      },
    },
  },
  issues: {
    select: {
      id: true,
      title: true,
      description: true,
      riskLevel: true,
      status: true,
      taskId: true,
      assignee: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { comments: true, attachments: true, subTasks: true, issues: true },
  },
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
    private notifications: NotificationsService,
  ) {}

  async findAll(
    projectId: string,
    query?: {
      stepId?: string;
      status?: string;
      priority?: string;
      assigneeId?: string;
      includeSubtasks?: string;
    },
  ) {
    const where: any = { projectId };
    if (!query?.includeSubtasks) where.parentId = null;
    if (query?.stepId) where.stepId = query.stepId;
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.assigneeId) {
      where.assignees = { some: { userId: query.assigneeId } };
    }

    return this.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findKanban(projectId: string) {
    const [steps, tasks] = await Promise.all([
      this.prisma.step.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
      }),
      this.prisma.task.findMany({
        where: { projectId, parentId: null },
        select: {
          ...TASK_SELECT,
          // 카드에 표기할 워크로드(일감) 통계용
          workLogs: { select: { stage: true } },
          subTasks: {
            select: TASK_SELECT,
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    // 완료 이상 단계 = COMPLETED, USER_CONFIRMED, DEPLOYED
    const COMPLETED_STAGES = ['COMPLETED', 'USER_CONFIRMED', 'DEPLOYED'];
    const now = new Date();
    const withStats = tasks.map((t) => {
      const { workLogs, ...rest } = t as any;
      const total = workLogs.length;
      const completed = workLogs.filter((w: any) =>
        COMPLETED_STAGES.includes(w.stage),
      ).length;
      // 지연: 태스크 마감일이 지났는데 완료 이상이 아닌 일감이 남아있음
      const overdue =
        !!rest.dueDate && new Date(rest.dueDate) < now && completed < total;
      return { ...rest, workLogStats: { total, completed, overdue } };
    });

    return steps.map((step, idx) => ({
      ...step,
      // 단계 미지정(orphan) 태스크는 첫 컬럼에 함께 표시
      tasks: withStats.filter(
        (t) => t.stepId === step.id || (idx === 0 && !t.stepId),
      ),
    }));
  }

  async findGantt(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId, parentId: null },
      select: {
        ...TASK_SELECT,
        subTasks: { select: TASK_SELECT },
      },
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // 간트 좌측 태스크 순서 일괄 저장 (드래그 정렬)
  async reorderGantt(projectId: string, taskIds: string[]) {
    await this.prisma.$transaction(
      taskIds.map((id, index) =>
        this.prisma.task.updateMany({
          where: { id, projectId },
          data: { order: index },
        }),
      ),
    );
    return { ok: true };
  }

  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        assignees: { some: { userId } },
      },
      select: TASK_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        ...TASK_SELECT,
        comments: {
          where: { parentId: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: { select: { id: true, name: true, avatar: true } },
            replies: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                author: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimetype: true,
            size: true,
            url: true,
            createdAt: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        subTasks: { select: TASK_SELECT },
      },
    });
    if (!task) throw new NotFoundException('태스크를 찾을 수 없습니다.');
    return task;
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    const { assigneeIds, labelIds, personnelIds, ...raw } = dto;

    // 단계(컬럼)에 생성되면 그 컬럼의 status를 상속, 아니면 dto.status(없으면 기본 TODO)
    let status = raw.status;
    if (raw.stepId) {
      const step = await this.prisma.step.findUnique({
        where: { id: raw.stepId },
        select: { status: true },
      });
      if (step) status = step.status;
    }

    const task = await this.prisma.task.create({
      data: {
        title: raw.title,
        description: raw.description || undefined,
        requester: raw.requester || undefined,
        priority: raw.priority,
        status,
        stepId: raw.stepId || undefined,
        startDate: raw.startDate ? new Date(raw.startDate) : undefined,
        dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
        order: raw.order,
        parentId: raw.parentId || undefined,
        projectId,
        createdById: userId,
        assignees: assigneeIds?.length
          ? { createMany: { data: assigneeIds.map((id) => ({ userId: id })) } }
          : undefined,
        labels: labelIds?.length
          ? { createMany: { data: labelIds.map((id) => ({ labelId: id })) } }
          : undefined,
        personnel: personnelIds?.length
          ? {
              createMany: {
                data: personnelIds.map((id) => ({ personnelId: id })),
              },
            }
          : undefined,
      },
      select: TASK_SELECT,
    });

    await this.activityLogs.log({
      userId,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: task.id,
      entityName: task.title,
      projectId,
      taskId: task.id,
    });

    if (assigneeIds?.length) {
      await Promise.all(
        assigneeIds
          .filter((id) => id !== userId)
          .map((id) =>
            this.notifications.create({
              userId: id,
              type: 'TASK_ASSIGNED',
              title: '새 태스크가 할당되었습니다',
              message: `"${task.title}" 태스크가 할당되었습니다.`,
              link: `/tasks/${task.id}`,
            }),
          ),
      );
    }

    return task;
  }

  // 엑셀 일괄 등록: 업무구분별로 상위 태스크를 만들고 각 행을 하위 태스크로 생성
  async bulkCreate(
    projectId: string,
    userId: string,
    rows: Array<{
      category: string;
      title?: string;
      description?: string;
      assigneeName?: string;
      priority?: string;
      startDate?: string;
      dueDate?: string;
      part?: string;
    }>,
  ) {
    // 업무구분(category)만 필수, 요구사항(title)은 선택
    const valid = rows.filter((r) => r.category?.trim());
    if (valid.length === 0) {
      throw new NotFoundException(
        '등록할 유효한 데이터가 없습니다. (업무구분 필수)',
      );
    }

    // 첫 번째 컬럼(Step) — 상위/하위 모두 여기로
    const firstStep = await this.prisma.step.findFirst({
      where: { projectId },
      orderBy: { order: 'asc' },
      select: { id: true, status: true },
    });

    // 프로젝트 멤버(담당자 이름 매칭용)
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: { user: { select: { id: true, name: true } } },
    });
    const nameToUserId = new Map(
      members.map((m) => [m.user.name.trim(), m.user.id]),
    );

    const PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    const normPriority = (p?: string) => {
      const up = (p ?? '').trim().toUpperCase();
      return PRIORITIES.includes(up) ? up : 'MEDIUM';
    };
    const parseDate = (d?: string) => {
      if (!d?.trim()) return undefined;
      const dt = new Date(d.trim());
      return isNaN(dt.getTime()) ? undefined : dt;
    };

    // 업무구분(category)별 그룹핑 — 입력 순서 유지
    const categories: string[] = [];
    const grouped = new Map<string, typeof valid>();
    for (const r of valid) {
      const cat = r.category.trim();
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
        categories.push(cat);
      }
      grouped.get(cat)!.push(r);
    }

    let parentCount = 0;
    let childCount = 0;

    // 기존 상위 태스크(같은 업무구분 제목)는 재사용
    const existingParents = await this.prisma.task.findMany({
      where: { projectId, parentId: null, title: { in: categories } },
      select: { id: true, title: true },
    });
    const titleToParentId = new Map(
      existingParents.map((p) => [p.title, p.id]),
    );

    await this.prisma.$transaction(
      async (tx) => {
        for (const cat of categories) {
          // 대량(162행+) 대비 타임아웃 여유 부여 (아래 옵션)
          let parentId = titleToParentId.get(cat);
          if (!parentId) {
            const firstRow = grouped.get(cat)![0];
            // 서브태스크 없는 행(title 없는 행)에 description이 있으면 상위 태스크에 적용
            const parentDescRow = grouped
              .get(cat)!
              .find((r) => !r.title?.trim() && r.description?.trim());
            const parent = await tx.task.create({
              data: {
                title: cat,
                part: firstRow?.part?.trim() || undefined,
                description: parentDescRow?.description?.trim() || undefined,
                projectId,
                createdById: userId,
                stepId: firstStep?.id,
                status: firstStep?.status ?? 'TODO',
              },
              select: { id: true },
            });
            parentId = parent.id;
            parentCount++;
          }

          const children = grouped.get(cat)!.filter((r) => r.title?.trim());
          for (let i = 0; i < children.length; i++) {
            const r = children[i];
            const assigneeId = r.assigneeName
              ? nameToUserId.get(r.assigneeName.trim())
              : undefined;
            await tx.task.create({
              data: {
                title: r.title!.trim(),
                description: r.description?.trim() || undefined,
                priority: normPriority(r.priority) as any,
                status: firstStep?.status ?? 'TODO',
                stepId: firstStep?.id,
                startDate: parseDate(r.startDate),
                dueDate: parseDate(r.dueDate),
                order: i,
                parentId,
                projectId,
                createdById: userId,
                assignees: assigneeId
                  ? { create: { userId: assigneeId } }
                  : undefined,
              },
            });
            childCount++;
          }
        }
      },
      { timeout: 60000, maxWait: 10000 },
    );

    return { parentCount, childCount, total: childCount };
  }

  async update(
    taskId: string,
    userId: string,
    userRole: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!existing) throw new NotFoundException();

    if (userRole !== 'ADMIN' && existing.createdById !== userId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: existing.projectId } },
      });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
        throw new ForbiddenException(
          '태스크 수정은 작성자 또는 관리자만 가능합니다.',
        );
      }
    }

    const { assigneeIds, labelIds, personnelIds, startDate, dueDate, ...data } =
      dto;

    // 단계(컬럼)를 바꾸면 그 단계의 status를 자동 적용 (단계가 진행 상태의 단일 기준)
    if (data.stepId && data.stepId !== existing.stepId) {
      const step = await this.prisma.step.findUnique({
        where: { id: data.stepId },
        select: { status: true },
      });
      if (step) data.status = step.status;
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            createMany: { data: assigneeIds.map((id) => ({ userId: id })) },
          },
        }),
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            createMany: { data: labelIds.map((id) => ({ labelId: id })) },
          },
        }),
        ...(personnelIds !== undefined && {
          personnel: {
            deleteMany: {},
            createMany: {
              data: personnelIds.map((id) => ({ personnelId: id })),
            },
          },
        }),
      },
      select: TASK_SELECT,
    });

    const action =
      dto.status && dto.status !== existing.status
        ? 'STATUS_CHANGED'
        : dto.priority && dto.priority !== existing.priority
          ? 'PRIORITY_CHANGED'
          : 'UPDATED';

    await this.activityLogs.log({
      userId,
      action,
      entityType: 'TASK',
      entityId: task.id,
      entityName: task.title,
      projectId: existing.projectId,
      taskId: task.id,
      metadata: dto.status
        ? { from: existing.status, to: dto.status }
        : undefined,
    });

    return task;
  }

  async moveTask(
    taskId: string,
    userId: string,
    stepId: string | null,
    order: number,
  ) {
    // 카드를 단계(컬럼)로 옮기면 그 컬럼에 매핑된 status를 그대로 따라간다
    let statusUpdate: { status?: import('@prisma/client').TaskStatus } = {};
    if (stepId) {
      const step = await this.prisma.step.findUnique({
        where: { id: stepId },
        select: { status: true },
      });
      if (step) statusUpdate.status = step.status;
    }

    const moving = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!moving) throw new NotFoundException('태스크를 찾을 수 없습니다.');

    // 대상 컬럼의 기존 태스크(이동 대상 제외)를 순서대로 가져와 지정 위치에 삽입 후 전체 재정렬
    const siblings = await this.prisma.task.findMany({
      where: {
        projectId: moving.projectId,
        stepId: stepId ?? null,
        parentId: null,
        id: { not: taskId },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    const ids = siblings.map((s) => s.id);
    const insertAt = Math.max(0, Math.min(order, ids.length));
    ids.splice(insertAt, 0, taskId);

    // order를 0,1,2…로 다시 매겨 순서값 충돌 제거 (이동 카드만 stepId/status도 갱신)
    await this.prisma.$transaction(
      ids.map((id, idx) =>
        this.prisma.task.update({
          where: { id },
          data:
            id === taskId
              ? { stepId, order: idx, ...statusUpdate }
              : { order: idx },
        }),
      ),
    );

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: TASK_SELECT,
    });

    await this.activityLogs.log({
      userId,
      action: 'MOVED',
      entityType: 'TASK',
      entityId: taskId,
      entityName: task?.title ?? '',
      projectId: moving.projectId,
      taskId,
    });

    return task;
  }

  async remove(taskId: string, userId: string, userRole: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException();

    if (userRole !== 'ADMIN' && task.createdById !== userId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: task.projectId } },
      });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
        throw new ForbiddenException(
          '태스크 삭제는 작성자 또는 관리자만 가능합니다.',
        );
      }
    }

    await this.prisma.task.delete({ where: { id: taskId } });

    await this.activityLogs.log({
      userId,
      action: 'DELETED',
      entityType: 'TASK',
      entityId: taskId,
      entityName: task.title,
      projectId: task.projectId,
    });

    return { message: '태스크가 삭제되었습니다.' };
  }
}
