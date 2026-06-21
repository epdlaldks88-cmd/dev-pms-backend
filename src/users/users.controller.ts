import {
  Controller, Get, Patch, Post, Body, Param, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // 전체 사용자 목록 (로그인한 사용자 누구나 조회 가능 - 프로젝트 멤버 추가 등에 필요)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('online')
  getOnlineIds() {
    return this.usersService.getOnlineIds();
  }

  @Post('me/ping')
  ping(@Req() req: any) {
    return this.usersService.markOnline(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 내 프로필 수정
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // 비밀번호 변경
  @Post('profile/password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  // 관리자: 특정 사용자 role/name 수정
  @Patch(':id/admin')
  adminUpdate(@Req() req: any, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자만 접근 가능합니다.');
    }
    return this.usersService.adminUpdateUser(req.user.id, id, dto);
  }
}
