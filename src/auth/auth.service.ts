import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);

    // 첫 번째 유저는 자동으로 ADMIN + ACTIVE 처리
    const userCount = await this.prisma.user.count();
    const isFirst = userCount === 0;

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        role: isFirst ? 'ADMIN' : 'MEMBER',
        status: isFirst ? 'ACTIVE' : 'PENDING',
      },
    });

    if (isFirst) {
      return { pending: false, message: '관리자 계정이 생성되었습니다. 로그인해주세요.' };
    }
    return { pending: true, message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    if (user.status === 'PENDING') {
      throw new ForbiddenException('관리자 승인 대기 중입니다. 승인 후 로그인하실 수 있습니다.');
    }
    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('비활성화된 계정입니다. 관리자에게 문의해주세요.');
    }

    const { password: _, ...safeUser } = user;
    const tokens = await this.generateTokens(user.id, user.email);
    return { user: safeUser, ...tokens };
  }

  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException();

    await this.prisma.refreshToken.delete({ where: { token } });
    const tokens = await this.generateTokens(user.id, user.email);
    return tokens;
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    return { message: '로그아웃 되었습니다.' };
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
        },
      ),
      uuidv4(),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
