import { Controller, Post, Body, Get, Query, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.svc.create(dto);
  }

  @Get()
  async list(@Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.findAll({ search, page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCategoryDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.remove(id);
  }
}
