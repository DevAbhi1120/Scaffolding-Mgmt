import { Controller, Post, Body, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnItemsDto } from './dto/return-items.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('inventory')
export class ReturnsController {
  constructor(private returnsService: ReturnsService) {}

  // POST /inventory/return
  @Post('return')
  @UseGuards(JwtAuthGuard)
  async returnItems(@Body() dto: ReturnItemsDto, @Req() req: Request) {
    const user = req.user as any;
    return this.returnsService.returnItems(dto, user?.userId ?? user?.id);
  }

  // GET /inventory/returns/order/:orderId
  @Get('returns/order/:orderId')
  @UseGuards(JwtAuthGuard)
  async returnsForOrder(@Param('orderId') orderId: string) {
    return this.returnsService.getReturnsForOrder(orderId);
  }
}
