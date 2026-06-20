import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, extname } from 'path';
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
import { TemplatesModule } from './templates/templates.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        // 업로드 파일이 브라우저에서 실행/렌더링되어 저장형 XSS가 되는 것을 방지.
        setHeaders: (res, filePath) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          const ext = extname(filePath).toLowerCase();
          // 이미지·PDF만 인라인 미리보기 허용, 나머지는 강제 다운로드
          const inlineOk = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.pdf'].includes(ext);
          if (!inlineOk) res.setHeader('Content-Disposition', 'attachment');
        },
      },
    }),
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
    TemplatesModule,
    RoomsModule,
  ],
})
export class AppModule {}
