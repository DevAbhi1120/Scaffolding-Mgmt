// src/inventory/loss.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';

@Controller('inventories/loss')
export class LossController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post('damaged')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async markDamaged(@Body() dto: MarkDamagedDto, @Request() req: any) {
    const user = req.user;
    await this.inventoryService.markDamaged(dto, user?.userId ?? user?.id);
    return { success: true };
  }

  @Post('lost')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async markLost(@Body() dto: MarkLostDto, @Request() req: any) {
    const user = req.user;
    await this.inventoryService.markLost(dto, user?.userId ?? user?.id);
    return { success: true };
  }

  @Post('recover')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async recoverItem(@Body() dto: RecoverItemDto, @Request() req: any) {
    const user = req.user;
    await this.inventoryService.recoverItem(dto, user?.userId ?? user?.id);
    return { success: true };
  }

  @Get('list')
  async listLostDamaged(
    @Query('productId') productId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const items = await this.inventoryService.listLostDamaged({
      productId,
      from,
      to,
    });
    return { success: true, data: items };
  }
}
