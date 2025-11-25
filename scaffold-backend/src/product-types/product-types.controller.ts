// src/product-types/product-types.controller.ts
import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Param,
    Put,
    Delete,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Controller('product-types')
export class ProductTypesController {
    constructor(private svc: ProductTypesService) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('thumbnail_image', {
            storage: multer.memoryStorage(),
        }),
    )
    async create(
        @Body() dto: CreateProductTypeDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.svc.create(dto, file);
    }

    @Get()
    async list(
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.svc.findAll({
            search,
            page: Number(page),
            limit: Number(limit),
        });
    }

    @Get(':id')
    async get(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.svc.findOne(id);
    }

    @Put(':id')
    @UseInterceptors(
        FileInterceptor('thumbnail_image', {
            storage: multer.memoryStorage(),
        }),
    )
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateProductTypeDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.svc.update(id, dto, file);
    }

    @Delete(':id')
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.svc.remove(id);
    }
}
