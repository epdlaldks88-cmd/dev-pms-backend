import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface TaskChangeEvent {
  projectId: string;
  type: 'move' | 'update' | 'create' | 'delete';
  actorId: string;
}

@Injectable()
export class TasksSseService {
  private subject = new Subject<TaskChangeEvent>();

  emit(event: TaskChangeEvent) {
    this.subject.next(event);
  }

  stream(projectId: string, _userId: string) {
    // actor를 제외하지 않음: 같은 사용자의 다른 뷰(칸반↔간트)도 실시간 동기화되도록.
    // 원래 뷰는 낙관적 업데이트 후 재요청이라 중복 갱신돼도 무해함.
    return this.subject.pipe(
      filter((e) => e.projectId === projectId),
      map((e) => ({ data: { type: e.type } })),
    );
  }
}
