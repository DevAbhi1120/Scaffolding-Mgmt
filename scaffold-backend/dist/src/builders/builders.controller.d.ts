import { BuildersService } from './builders.service';
import { CreateBuilderDto } from './dto/create-builder.dto';
import { UpdateBuilderDto } from './dto/update-builder.dto';
export declare class BuildersController {
    private svc;
    constructor(svc: BuildersService);
    create(dto: CreateBuilderDto): Promise<import("../database/entities/builder.entity").Builder>;
    list(page?: number, limit?: number): Promise<{
        items: import("../database/entities/builder.entity").Builder[];
        total: number;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<import("../database/entities/builder.entity").Builder>;
    update(id: string, dto: UpdateBuilderDto): Promise<import("../database/entities/builder.entity").Builder>;
    remove(id: string): Promise<{
        success: string;
    }>;
}
