import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * 인증된 요청은 유저 단위, 비인증 요청(로그인 등)은 IP 단위로 rate limit.
 * nginx 뒤에 있으므로 main.ts의 trust proxy 설정으로 req.ip가 실제 클라이언트 IP가 된다.
 * (JwtAuthGuard 뒤에 배치해야 req.user가 채워져 유저 단위로 동작)
 */
@Injectable()
export class UserOrIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}
