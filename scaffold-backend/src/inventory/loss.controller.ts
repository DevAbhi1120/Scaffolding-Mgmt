import { Controller, Post, Body, UseGuards, Req, Param, Get, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
import { Request } from 'express';

@Controller('inventory')
export class InventoryLossController {
  constructor(private inventoryService: InventoryService) {}

  // Admin or team member can mark damaged (team member may report, admin approves billing)
  @Post('mark-damaged')
  @UseGuards(JwtAuthGuard)
  async markDamaged(@Body() dto: MarkDamagedDto, @Req() req: Request) {
    const user = req.user as any;
    return this.inventoryService.markDamaged(dto, user?.userId ?? user?.id);
  }

  @Post('mark-lost')
  @UseGuards(JwtAuthGuard)
  async markLost(@Body() dto: MarkLostDto, @Req() req: Request) {
    const user = req.user as any;
    return this.inventoryService.markLost(dto, user?.userId ?? user?.id);
  }

  @Post('recover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async recover(@Body() dto: RecoverItemDto, @Req() req: Request) {
    const user = req.user as any;
    return this.inventoryService.recoverItem(dto, user?.userId ?? user?.id);
  }

  // list lost/damaged (admin)
  @Get('loss/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list(@Query('productId') productId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.inventoryService.listLostDamaged({ productId, from, to });
  }
}
