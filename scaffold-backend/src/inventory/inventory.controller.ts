import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private svc: InventoryService) { }

  // ---------- ITEMS CRUD / LIST ----------

  @Post('items')
  async createItem(@Body() dto: CreateInventoryItemDto) {
    return this.svc.createItem(dto);
  }

  @Get('items')
  async listItems(
    @Query('productId') productId?: string,
    @Query('status') status?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.listItems({
      productId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // ---------- MOVEMENTS / STOCK ----------

  @Post('movement')
  async movement(@Body() dto: InventoryMovementDto) {
    return this.svc.createMovement(dto);
  }

  @Get('product/:id/available')
  async getAvailable(@Param('id', new ParseUUIDPipe()) id: string) {
    const qty = await this.svc.getAvailableQuantity(id);
    return { productId: id, available: qty };
  }

  @Get('product/:id/movements')
  async movements(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.svc.movementsForProduct(id, Number(page) || 1, Number(limit) || 50);
  }

  // ---------- ASSIGN / RETURN TO/FROM ORDER ----------

  @Post('assign')
  async assign(@Body() dto: AssignItemsDto) {
    return this.svc.assignToOrder(dto);
  }

  @Post('return')
  async return(@Body() dto: AssignItemsDto) {
    return this.svc.returnFromOrder(dto);
  }

  @Post('items/mark-damaged')
  async markDamaged(@Body() dto: MarkDamagedDto) {
    return this.svc.markDamaged(dto);
  }

  @Post('items/mark-lost')
  async markLost(@Body() dto: MarkLostDto) {
    return this.svc.markLost(dto);
  }

  @Post('items/recover')
  async recoverItem(@Body() dto: RecoverItemDto) {
    return this.svc.recoverItem(dto);
  }

  @Get('items/lost-damaged')
  async listLostDamaged(
    @Query('productId') productId?: string,
    @Query('builderId') builderId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.listLostDamaged({ productId, builderId, from, to });
  }
}
