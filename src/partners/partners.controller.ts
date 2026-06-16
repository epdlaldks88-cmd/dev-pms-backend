import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto, CreatePersonnelDto } from './dto/partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  @Get()
  findAll() {
    return this.partnersService.findAll();
  }

  @Get('personnel/all')
  allPersonnel() {
    return this.partnersService.allPersonnel();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }

  @Post(':id/personnel')
  addPersonnel(@Param('id') id: string, @Body() dto: CreatePersonnelDto) {
    return this.partnersService.addPersonnel(id, dto);
  }

  @Patch('personnel/:personnelId')
  updatePersonnel(@Param('personnelId') personnelId: string, @Body() dto: CreatePersonnelDto) {
    return this.partnersService.updatePersonnel(personnelId, dto);
  }

  @Delete('personnel/:personnelId')
  removePersonnel(@Param('personnelId') personnelId: string) {
    return this.partnersService.removePersonnel(personnelId);
  }
}
