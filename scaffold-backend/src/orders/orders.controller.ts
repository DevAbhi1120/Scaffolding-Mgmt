import { Controller, Post, Body, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.svc.create(dto);
  }

  @Get()
  async list(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findOne(id);
  }
}
