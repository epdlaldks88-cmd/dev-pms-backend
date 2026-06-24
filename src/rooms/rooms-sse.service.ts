import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface RoomEvent {
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
}

@Injectable()
export class RoomsSseService {
  private subject = new Subject<RoomEvent>();

  emit(event: RoomEvent) {
    this.subject.next(event);
  }

  // 해당 룸의 멤버 userId 목록을 받아서 그 멤버들에게만 스트림 전달
  stream(userId: string, roomIds: string[]) {
    return this.subject.pipe(
      filter((e) => roomIds.includes(e.roomId)),
      map((e) => ({ data: { roomId: e.roomId, senderId: e.senderId, senderName: e.senderName, content: e.content } })),
    );
  }
}
