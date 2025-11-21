import { Controller, Post, Body, UseGuards, Get, Param, Put, Query } from '@nestjs/common';
import { VoidsService } from './void.service';
import { CreateVoidDto } from './dto/create-void.dto';
import { UpdateVoidDto } from './dto/update-void.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';


@Controller('voids')
export class VoidsController {
    constructor(private svc: VoidsService) { }


    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() dto: CreateVoidDto) {
        return this.svc.create(dto);
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


    // admin only update
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(@Param('id') id: string, @Body() dto: UpdateVoidDto) {
        return this.svc.update(id, dto);
    }


    // list expiring in next `days` (default 14)
    @Get('expiring')
    @UseGuards(JwtAuthGuard)
    async expiring(@Query('days') days?: string) {
        const d = days ? Number(days) : 14;
        return this.svc.findExpiring(d);
    }
}