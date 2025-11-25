import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Builder } from '../database/entities/builder.entity';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';

@Injectable()
export class BuildersService {
    constructor(
        @InjectRepository(Builder)
        private buildersRepo: Repository<Builder>,
    ) { }

    async create(dto: CreateBuilderDto): Promise<Builder> {
        const builder = this.buildersRepo.create(dto);
        return this.buildersRepo.save(builder);
    }

    async findAll(page = 1, limit = 20) {
        const [items, total] = await this.buildersRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { items, total, page, limit };
    }

    async findOne(id: string): Promise<Builder> {
        const builder = await this.buildersRepo.findOne({ where: { id } });
        if (!builder) {
            throw new NotFoundException('Builder not found');
        }
        return builder;
    }

    async update(id: string, dto: UpdateBuilderDto): Promise<Builder> {
        const builder = await this.buildersRepo.findOne({ where: { id } });
        if (!builder) {
            throw new NotFoundException('Builder not found');
        }
        Object.assign(builder, dto);
        return this.buildersRepo.save(builder);
    }

    async remove(id: string): Promise<void> {
        const result = await this.buildersRepo.delete(id);
        if (!result.affected) {
            throw new NotFoundException('Builder not found');
        }
    }
}
