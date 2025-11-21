import { SwmsService } from './swms.service';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
export declare class SwmsController {
    private svc;
    constructor(svc: SwmsService);
    create(dto: CreateSwmsDto): Promise<import("../database/entities/swms.entity").Swms>;
    listByOrder(orderId: string): Promise<import("../database/entities/swms.entity").Swms[]>;
    get(id: string): Promise<import("../database/entities/swms.entity").Swms>;
    update(id: string, dto: UpdateSwmsDto): Promise<import("../database/entities/swms.entity").Swms>;
}
