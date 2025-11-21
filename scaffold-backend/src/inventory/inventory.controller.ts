import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private svc: InventoryService) {}

  @Post('items')
  async createItem(@Body() dto: CreateInventoryItemDto) {
    return this.svc.createItem(dto);
  }

  @Get('items')
  async listItems(@Query('productId') productId?: string, @Query('status') status?: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.listItems({ productId, status, page: Number(page), limit: Number(limit) });
  }

  @Post('movement')
  async movement(@Body() dto: InventoryMovementDto) {
    return this.svc.createMovement(dto);
  }

  @Post('assign')
  async assign(@Body() dto: AssignItemsDto) {
    return this.svc.assignToOrder(dto);
  }

  @Post('return')
  async return(@Body() dto: AssignItemsDto) {
    return this.svc.returnFromOrder(dto);
  }

  @Get('product/:id/available')
  async getAvailable(@Param('id', new ParseUUIDPipe()) id: string) {
    const qty = await this.svc.getAvailableQuantity(id);
    return { productId: id, available: qty };
  }

  @Get('product/:id/movements')
  async movements(@Param('id', new ParseUUIDPipe()) id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.movementsForProduct(id, Number(page) || 1, Number(limit) || 50);
  }
}
