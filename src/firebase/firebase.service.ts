import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { credential, apps, initializeApp, messaging } from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      if (!apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
          this.logger.error(
            'FIREBASE_SERVICE_ACCOUNT_JSON 환경변수가 없습니다',
          );
          return;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        initializeApp({
          credential: credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin SDK 초기화 완료');
      }
    } catch (error) {
      this.logger.error(`Firebase 초기화 실패: ${error.message}`);
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      await messaging().send({
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
