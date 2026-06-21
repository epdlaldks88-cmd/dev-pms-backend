import {
  Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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

  // 관리자: 승인 대기 목록
  @Get('pending')
  getPending(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('관리자만 접근 가능합니다.');
    return this.usersService.getPendingUsers();
  }

  // 관리자: 승인
  @Patch(':id/approve')
  approve(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('관리자만 접근 가능합니다.');
    return this.usersService.approveUser(id);
  }

  // 관리자: 거절(삭제)
  @Delete(':id/reject')
  reject(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('관리자만 접근 가능합니다.');
    return this.usersService.rejectUser(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('profile/password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Patch(':id/admin')
  adminUpdate(@Req() req: any, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('관리자만 접근 가능합니다.');
    return this.usersService.adminUpdateUser(req.user.id, id, dto);
  }
}
