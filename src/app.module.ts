import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { StepsModule } from './steps/steps.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { LabelsModule } from './labels/labels.module';
import { PartnersModule } from './partners/partners.module';
import { WorkLogsModule } from './worklogs/worklogs.module';
import { MeetingsModule } from './meetings/meetings.module';
import { IssuesModule } from './issues/issues.module';
import { NoticesModule } from './notices/notices.module';
import { SearchModule } from './search/search.module';
import { MessagesModule } from './messages/messages.module';
import { CanvasModule } from './canvas/canvas.module';
import { SheetsModule } from './sheets/sheets.module';
import { FirebaseModule } from './firebase/firebase.module';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';
import { TemplatesModule } from './templates/templates.module';
import { RoomsModule } from './rooms/rooms.module';
import { QAModule } from './qa/qa.module';
import { ChatModule } from './chat/chat.module';
import { WbsModule } from './wbs/wbs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 기본 rate limit: 60초당 120요청 (라우트별 @Throttle로 더 강하게 제한 가능)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    // 업로드 파일은 정적 공개 서빙 대신 인증된 다운로드 엔드포인트로만 제공한다.
    // (GET /api/attachments/:id/download, GET /api/templates/files/:id/download)
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    StepsModule,
    TasksModule,
    CommentsModule,
    AttachmentsModule,
    NotificationsModule,
    ActivityLogsModule,
    LabelsModule,
    PartnersModule,
    WorkLogsModule,
    MeetingsModule,
    IssuesModule,
    NoticesModule,
    SearchModule,
    MessagesModule,
    CanvasModule,
    SheetsModule,
    FirebaseModule,
    DeviceTokensModule,
    TemplatesModule,
    RoomsModule,
    QAModule,
    ChatModule,
    WbsModule,
  ],
})
export class AppModule {}
