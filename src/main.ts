import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // nginx 뒤에 있으므로 X-Forwarded-For를 신뢰해 req.ip가 실제 클라이언트 IP가 되게 함
  // (rate limit이 nginx IP 하나로 뭉뚱그려지지 않도록)
  app.set('trust proxy', 1);

  const isProd = process.env.NODE_ENV === 'production';

  // 보안 헤더. CSP는 API 서버 + (개발 환경) Swagger UI 호환을 위해 비활성화하고,
  // 정적 첨부파일이 프론트(다른 오리진)에서 로드되도록 CORP는 cross-origin 허용.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: 콤마로 구분된 CORS_ORIGINS 환경변수로 허용 출처 지정.
  // 모바일 앱처럼 Origin 헤더가 없는 요청(!origin)도 허용한다.
  const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  });

  // Swagger (OpenAPI) 문서 — /api/docs. 운영 환경에서는 비활성화.
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PMS API')
      .setDescription('PMS 백엔드 API 문서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 PMS Backend running on http://localhost:${port}/api`);
  if (!isProd) console.log(`📚 Swagger docs on http://localhost:${port}/api/docs`);
}
bootstrap();
