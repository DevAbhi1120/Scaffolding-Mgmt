import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { SwmsService } from './swms.service';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';

@Controller('swms')
export class SwmsController {
  constructor(private svc: SwmsService) {}

  @Post()
  async create(@Body() dto: CreateSwmsDto) {
    return this.svc.create(dto);
  }

  @Get('order/:orderId')
  async listByOrder(@Param('orderId') orderId: string) {
    return this.svc.findByOrder(orderId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  // Admin-only edits should be protected by RolesGuard — pass isAdmin=true from guard or deduce from user
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSwmsDto) {
    // TODO: wire RolesGuard to ensure only Admin can call this; for now pass isAdmin = true only for example
    return this.svc.update(id, dto, true);
  }
}
