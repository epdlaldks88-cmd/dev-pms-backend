import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App;

  onModuleInit() {
    const serviceAccountPath = path.resolve(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        'src/firebase-service-account.json',
    );

    if (!fs.existsSync(serviceAccountPath)) {
      this.logger.error(
        `Firebase 서비스 계정 파일을 찾을 수 없습니다: ${serviceAccountPath}`,
      );
      return;
    }

    if (!getApps().length) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );
      this.app = initializeApp({
        credential: cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK 초기화 완료');
    } else {
      this.app = getApps()[0];
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      await getMessaging(this.app).send({
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `푸시 발송 실패 (token: ${fcmToken}): ${error.message}`,
      );
      return false;
    }
  }

  async sendPushToMultiple(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const results = await Promise.allSettled(
      fcmTokens.map((token) =>
        this.sendPushNotification(token, title, body, data),
      ),
    );
    const success = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`푸시 발송 완료: ${success}/${fcmTokens.length}건 성공`);
  }
}
