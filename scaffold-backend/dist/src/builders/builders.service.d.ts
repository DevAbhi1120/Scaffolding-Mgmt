import { Repository } from 'typeorm';
import { Builder } from '../database/entities/builder.entity';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';
export declare class BuildersService {
    private buildersRepo;
    constructor(buildersRepo: Repository<Builder>);
    create(dto: CreateBuilderDto): Promise<Builder>;
    findAll(page?: number, limit?: number): Promise<{
        items: Builder[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Builder>;
    update(id: string, dto: UpdateBuilderDto): Promise<Builder>;
    remove(id: string): Promise<void>;
}
