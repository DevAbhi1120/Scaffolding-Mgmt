import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { QueryChecklistDto } from './dto/query-checklist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('checklists')
export class ChecklistsController {
  constructor(private svc: ChecklistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateChecklistDto) {
    return this.svc.create(dto);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async listByOrder(@Param('orderId') orderId: string) {
    return this.svc.findByOrder(orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  // Admin-only search endpoint to query across builders/orders/dates
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async search(@Query() q: QueryChecklistDto) {
    return this.svc.search(q);
  }
}
