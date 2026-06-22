import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('device-tokens')
@UseGuards(JwtAuthGuard)
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post('register')
  async register(
    @Req() req,
    @Body() body: { token: string; platform: string },
  ) {
    return this.deviceTokensService.register(
      req.user.id,
      body.token,
      body.platform,
    );
  }

  @Delete(':token')
  async remove(@Req() req, @Param('token') token: string) {
    return this.deviceTokensService.remove(req.user.id, token);
  }
}
