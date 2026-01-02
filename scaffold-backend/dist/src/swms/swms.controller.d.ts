import { SwmsService } from './swms.service';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
export declare class SwmsController {
    private svc;
    constructor(svc: SwmsService);
    create(dto: CreateSwmsDto, files?: Express.Multer.File[]): Promise<import("../database/entities/swms.entity").Swms>;
    listAll(): Promise<import("../database/entities/swms.entity").Swms[]>;
    listByOrder(orderId: string): Promise<import("../database/entities/swms.entity").Swms[]>;
    get(id: string): Promise<import("../database/entities/swms.entity").Swms>;
    update(id: string, dto: UpdateSwmsDto, newFiles?: Express.Multer.File[]): Promise<import("../database/entities/swms.entity").Swms>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
