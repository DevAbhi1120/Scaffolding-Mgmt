// src/inventory/inventory.controller.ts
import { Controller, Post, Body, Get, Param, Put, Delete, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
import { InventoryStatus } from '../database/entities/inventory-item.entity';
import { InventoryBatchStatus } from '../database/entities/inventory-batch.entity';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly svc: InventoryService) { }

  // Create inventory (form) - creates batch or per-serial items
  @Post('items')
  async createFromForm(@Body() dto: CreateInventoryFromFormDto) {
    return this.svc.createFromForm(dto);
  }

  // List items (inventory_items)
  @Get('items')
  async listItems(@Query('productId') productId?: string) {
    return this.svc.listItems(productId);
  }


  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    const item = await this.svc.getItemById(id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // DELETE single serial-tracked item
  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    const deleted = await this.svc.deleteItemById(id);
    if (!deleted) throw new NotFoundException('Item not found or could not be deleted');
    return { success: true };
  }

  // BULK delete everything for product (batches + items + movements)
  @Delete('product/:productId')
  async deleteProductInventory(@Param('productId') productId: string) {
    await this.svc.deleteAllForProduct(productId);
    return { success: true };
  }

  // BATCH CRUD
  @Post('batches')
  async createBatch(@Body() dto: CreateBatchDto) {
    return this.svc.createBatch(dto);
  }

  @Get('batches')
  async listBatches(@Query('productId') productId?: string) {
    return this.svc.listBatches(productId);
  }

  @Get('batches/:id')
  async getBatch(@Param('id') id: string) {
    return this.svc.getBatch(id);
  }

  @Put('batches/:id')
  async updateBatch(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.svc.updateBatch(id, dto as any);
  }

  @Delete('batches/:id')
  async deleteBatch(@Param('id') id: string) {
    return this.svc.deleteBatch(id);
  }

  // Summary: availablePhysical = sum(batches) + count(in-store items)
  @Get('summary/:productId')
  async getSummary(@Param('productId') productId: string) {
    const summary = await this.svc.getProductSummary(productId);

    // sum of IN_STORE batches
    const batchSumRaw: any = await (this.svc as any).batchesRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.quantity),0)', 'sum')
      .where('b.product_id = :productId', { productId })
      .andWhere('b.status = :inStore', { inStore: InventoryBatchStatus.IN_STORE })
      .getRawOne();

    const batchQty = Number(batchSumRaw?.sum || 0);

    // count in-store items
    const items = await this.svc.listItems(productId);
    const itemCount = Array.isArray(items) ? items.filter((it) => it.status === InventoryStatus.IN_STORE).length : 0;

    const availablePhysical = batchQty + itemCount;

    return {
      productId,
      availablePhysical,
      stockBalance: summary.stockBalance,
      openingStock: summary.openingStock ?? 0,
      stockIn: summary.stockIn ?? 0,
      stockOut: summary.stockOut ?? 0,
    };
  }

  // mark damaged
  @Post('mark-damaged')
  async markDamaged(@Body() dto: MarkDamagedDto) {
    return this.svc.markItemDamaged(dto.itemId, dto.notes, dto.fee);
  }

  @Post('mark-lost')
  async markLost(@Body() dto: MarkLostDto) {
    return this.svc.markItemLost(dto.itemId, dto.notes, dto.fee);
  }

  @Post('recover')
  async recover(@Body() dto: RecoverItemDto) {
    return this.svc.recoverItem(dto.itemId, dto.notes);
  }

  @Get('lost-damaged')
  async listLostDamaged(@Query('productId') productId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.listLostDamaged({ productId, from, to });
  }
}
