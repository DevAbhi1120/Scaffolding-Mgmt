// src/inventory/inventory.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post('items')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createFromForm(
    @Body() dto: CreateInventoryFromFormDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id;
    const summary = await this.inventoryService.createFromForm(dto, userId);
    return {
      success: true,
      data: summary,
    };
  }

  @Get('products/:productId/summary')
  async getProductSummary(@Param('productId') productId: string) {
    const summary = await this.inventoryService.getProductSummary(productId);
    return {
      success: true,
      data: summary,
    };
  }
}
