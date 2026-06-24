import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initializeApp, getApps, cert } = require('firebase-admin/app');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getMessaging } = require('firebase-admin/messaging');

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    try {
      if (!getApps().length) {
        let serviceAccount: any;

        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountJson) {
          serviceAccount = JSON.parse(serviceAccountJson);
        } else if (serviceAccountPath) {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(serviceAccountPath);
          if (fs.existsSync(fullPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          }
        }

        if (!serviceAccount) {
          this.logger.error('Firebase 서비스 계정 설정이 없습니다');
          return;
        }

        initializeApp({
          credential: cert(serviceAccount),
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
      await getMessaging().send({
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
