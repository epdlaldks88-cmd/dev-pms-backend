import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface NotificationEvent {
  userId: string;
  type: string;
  title: string;
  message: string;
}

@Injectable()
export class NotificationsSseService {
  private subject = new Subject<NotificationEvent>();

  emit(event: NotificationEvent) {
    this.subject.next(event);
  }

  stream(userId: string): Observable<any> {
    return this.subject.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({
        data: JSON.stringify(event),
      })),
    );
  }
}
