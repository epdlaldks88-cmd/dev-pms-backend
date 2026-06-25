import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      client.data.userId = payload.sub;
      // 유저별 룸 입장
      client.join(`user:${payload.sub}`);
      console.log(`WebSocket 연결: userId=${payload.sub}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`WebSocket 해제: userId=${client.data.userId}`);
  }

  // 채팅방 입장
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(`room:${roomId}`);
  }

  // 채팅방 퇴장
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(`room:${roomId}`);
  }

  // 채팅방 메시지 브로드캐스트
  emitRoomMessage(roomId: string, message: any) {
    this.server.to(`room:${roomId}`).emit('roomMessage', message);
  }

  // 1:1 쪽지 브로드캐스트
  emitDirectMessage(userId: string, message: any) {
    this.server.to(`user:${userId}`).emit('directMessage', message);
  }

  // 알림 브로드캐스트
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
