import { VoidsService } from './void.service';
import { CreateVoidDto } from './dto/create-void.dto';
import { UpdateVoidDto } from './dto/update-void.dto';
export declare class VoidsController {
    private svc;
    constructor(svc: VoidsService);
    create(dto: CreateVoidDto): Promise<import("./void.entity").VoidProtection>;
    listByOrder(orderId: string): Promise<import("./void.entity").VoidProtection[]>;
    get(id: string): Promise<import("./void.entity").VoidProtection>;
    update(id: string, dto: UpdateVoidDto): Promise<import("./void.entity").VoidProtection>;
    expiring(days?: string): Promise<import("./void.entity").VoidProtection[]>;
}
