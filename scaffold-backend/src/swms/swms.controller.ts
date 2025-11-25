// src/swms/swms.controller.ts
import { Controller, Post, Body, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SwmsService } from './swms.service';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('swms')  // ← FIXED PREFIX
export class SwmsController {
  constructor(private svc: SwmsService) { }

  // CREATE SWMS
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateSwmsDto) {
    return this.svc.create(dto);
  }

  // LIST ALL SWMS (NEW!)
  @Get()
  @UseGuards(JwtAuthGuard)
  async listAll() {
    return this.svc.listAll();
  }

  // GET BY ORDER
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async listByOrder(@Param('orderId') orderId: string) {
    return this.svc.findByOrder(orderId);
  }

  // GET ONE
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  // UPDATE (admin only later)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateSwmsDto) {
    return this.svc.update(id, dto, true);
  }
}