import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, AdminUpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  position: true,
  department: true,
  phone: true,
  statusEmoji: true,
  statusText: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.statusEmoji !== undefined && { statusEmoji: dto.statusEmoji }),
        ...(dto.statusText !== undefined && { statusText: dto.statusText }),
      },
      select: USER_SELECT,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });

    // 비밀번호 변경 시 기존 refresh token 전부 폐기 → 탈취된 세션 강제 로그아웃
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async adminUpdateUser(requesterId: string, targetId: string, dto: AdminUpdateUserDto) {
    if (requesterId === targetId && dto.role) {
      throw new ForbiddenException('자신의 권한은 변경할 수 없습니다.');
    }
    return this.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(dto.role !== undefined && { role: dto.role as any }),
        ...(dto.name !== undefined && { name: dto.name }),
      },
      select: USER_SELECT,
    });
  }

  async markOnline(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async getOnlineIds(): Promise<string[]> {
    const threshold = new Date(Date.now() - 2 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { lastSeenAt: { gte: threshold } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  // backward compat
  async update(id: string, dto: UpdateProfileDto) {
    return this.updateProfile(id, dto);
  }
}
