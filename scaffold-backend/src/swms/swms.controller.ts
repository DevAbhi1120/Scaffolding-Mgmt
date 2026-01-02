// src/swms/swms.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { SwmsService } from './swms.service';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('swms')
export class SwmsController {
  constructor(private svc: SwmsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 20)) // max 20 files
  async create(
    @Body() dto: CreateSwmsDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.svc.create({ ...dto, files });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listAll() {
    return this.svc.listAll();
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

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('newFiles', 20))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSwmsDto,
    @UploadedFiles() newFiles?: Express.Multer.File[],
  ) {
    return this.svc.update(id, { ...dto, newFiles }, true);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}