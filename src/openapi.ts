import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';

/**
 * OpenAPI 스펙(openapi.json)을 파일로 추출한다.
 * preview 모드로 실행해 DB 연결/lifecycle 없이 데코레이터만 스캔하므로
 * 로컬에 DB가 없어도 동작한다.
 *
 *   npm run export:openapi   →   openapi.json 생성
 *
 * 생성된 파일을 앱 개발자에게 전달하면 Postman/Swagger Editor에 임포트해서
 * 운영 Swagger를 공개하지 않고도 최신 API 문서를 공유할 수 있다.
 */
async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('PMS API')
    .setDescription('PMS 백엔드 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi.json', JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log('✅ openapi.json 생성 완료');
}

exportOpenApi().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('❌ OpenAPI 추출 실패:', e);
  process.exit(1);
});
