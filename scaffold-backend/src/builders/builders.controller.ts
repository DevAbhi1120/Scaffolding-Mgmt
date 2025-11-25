import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    ParseUUIDPipe,
    Put,
    Delete,
} from '@nestjs/common';
import { BuildersService } from './builders.service';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';

@Controller('builders')
export class BuildersController {
    constructor(private svc: BuildersService) { }

    @Post()
    async create(@Body() dto: CreateBuilderDto) {
        return this.svc.create(dto);
    }

    @Get()
    async list(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.svc.findAll(Number(page) || 1, Number(limit) || 20);
    }

    @Get(':id')
    async get(@Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateBuilderDto,
    ) {
        return this.svc.update(id, dto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.svc.remove(id);
        return { success: 'Builder Deleted Sucessfully' };
    }
}
