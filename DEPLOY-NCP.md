# PMS 백엔드 — 네이버 클라우드(NCP) 배포 가이드

서버 VM 1대에 **Docker로 백엔드 + PostgreSQL + Nginx**를 함께 올리는 구성.

```
인터넷 ──▶ NCP Server (Ubuntu)
              ├─ Nginx (80, 리버스 프록시)
              ├─ NestJS 백엔드 (Docker)
              └─ PostgreSQL (Docker, 공유 DB)
```

---

## 0. 준비물
- NCP 계정 (https://www.ncloud.com) + 결제수단 등록
- 백엔드 코드 저장소: `https://github.com/minwooheo07/dev-pms-backend`

---

## 1. NCP 서버(VM) 생성  *(콘솔에서 직접)*

1. NCP 콘솔 → **Services > Compute > Server** 이동
2. **서버 생성** 클릭
3. 설정:
   - 이미지: **Ubuntu 22.04** (또는 최신 LTS)
   - 서버 타입: 초기엔 **Standard / 2vCPU 4GB** 정도면 충분 (트래픽 늘면 업)
   - 스토리지: 기본 50GB
   - 인증키: **새 인증키 생성** → `.pem` 파일 다운로드 후 안전 보관 (SSH 접속에 필요)
4. 생성 완료까지 몇 분 대기

## 2. 공인 IP 할당  *(콘솔)*
- **Server > Public IP** → **공인 IP 신청** → 방금 만든 서버에 연결
- 이 IP가 앱/웹이 호출할 주소가 됨 (예: `http://1.2.3.4`)

## 3. 방화벽(ACG) 설정  *(콘솔)*
- **Server > ACG** → 서버에 적용된 ACG 선택 → **규칙 설정**
- Inbound 규칙 추가:

| 프로토콜 | 포트 | 접근 소스 | 용도 |
|----------|------|-----------|------|
| TCP | 22 | 내 IP (또는 0.0.0.0/0) | SSH 접속 |
| TCP | 80 | 0.0.0.0/0 | HTTP API |
| TCP | 443 | 0.0.0.0/0 | HTTPS (도메인 적용 후) |

> ⚠️ PostgreSQL 5432 포트는 **열지 마세요.** DB는 서버 내부에서만 접근합니다.

## 4. 관리자 비밀번호 확인 후 SSH 접속
- 콘솔에서 서버 선택 → **관리자 비밀번호 확인** (위 `.pem` 키 업로드해서 복호화)
- 로컬 터미널에서 접속:
  ```bash
  ssh root@<공인IP>      # 또는 콘솔 안내 계정
  ```

---

## 5. 서버에 Docker 설치  *(SSH 접속 후)*
```bash
# Docker + Compose 설치
curl -fsSL https://get.docker.com | sh

# 설치 확인
docker --version
docker compose version
```

## 6. 코드 내려받기
```bash
apt-get update && apt-get install -y git
git clone https://github.com/minwooheo07/dev-pms-backend.git
cd dev-pms-backend
```

## 7. 환경변수 설정
```bash
cp .env.production.example .env
nano .env        # 아래 값들을 실제 값으로 변경
```
반드시 바꿀 값:
- `POSTGRES_PASSWORD` — 강력한 비밀번호
- `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — 무작위 문자열
  - 생성 예: `openssl rand -hex 32`
- `CORS_ORIGINS` — 웹 프론트 주소 + 앱 개발자 주소
  - 개발 초기엔 `*` 로 모두 허용 가능 (운영 전엔 좁히기)

## 8. 실행 (빌드 + 기동)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
- 첫 실행 시 이미지 빌드 + DB 마이그레이션(`prisma migrate deploy`)이 자동 수행됩니다.
- 로그 확인:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f backend
  ```
  `🚀 PMS Backend running` 이 보이면 성공.

## 9. 동작 확인
- 브라우저: `http://<공인IP>/api/docs` → **Swagger 문서**가 보이면 정상 🎉
- 이 주소(`http://<공인IP>/api`)를 앱 개발자에게 전달

---

## 10. (도메인 구매 후) 도메인 + HTTPS
1. 도메인 등록기관에서 도메인 구매 → A 레코드를 **공인 IP**로 지정
   - 예: `api.example.com → 1.2.3.4`
2. `nginx/conf.d/api.conf` 의 HTTPS 블록 주석 해제, `server_name` 을 도메인으로 변경
3. SSL 인증서 발급 (Let's Encrypt). 간단한 방법:
   ```bash
   # 서버에 certbot 설치 후 인증서 발급, nginx/certs 로 복사
   apt-get install -y certbot
   certbot certonly --standalone -d api.example.com
   # 발급된 인증서를 docker-compose 의 nginx/certs 볼륨에 연결
   ```
4. `docker-compose.prod.yml` 의 nginx `443` 포트와 certs 볼륨 주석 해제 후 재기동:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## 운영 명령어 모음
```bash
# 코드 업데이트 후 재배포
git pull
docker compose -f docker-compose.prod.yml up -d --build

# 상태 확인 / 로그
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend

# DB 백업 (서버에서)
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U pms pms_db > backup_$(date +%F).sql

# 중지 / 재시작
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml restart
```
