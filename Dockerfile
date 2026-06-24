# ───────────── 1) Build stage ─────────────
FROM node:22-slim AS builder

# Prisma 엔진 실행에 필요한 openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 설치 (캐시 최적화: package*.json 먼저 복사)
COPY package*.json ./
RUN npm ci

# 소스 복사 후 Prisma client 생성 + 빌드
COPY . .
RUN npx prisma generate
RUN npm run build

# devDependencies 제거 (런타임 이미지 경량화)
RUN npm prune --omit=dev


# ───────────── 2) Runtime stage ─────────────
FROM node:22-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# 빌드 결과물 + 런타임 의존성 + prisma(마이그레이션용) 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# 업로드 디렉터리 (compose에서 볼륨으로 마운트)
RUN mkdir -p uploads

EXPOSE 3000

# 컨테이너 시작 시 마이그레이션 적용 후 서버 기동
ENTRYPOINT ["./docker-entrypoint.sh"]
