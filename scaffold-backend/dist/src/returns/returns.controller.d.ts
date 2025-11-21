import { ReturnsService } from './returns.service';
import { ReturnItemsDto } from './dto/return-items.dto';
import { Request } from 'express';
export declare class ReturnsController {
    private returnsService;
    constructor(returnsService: ReturnsService);
    returnItems(dto: ReturnItemsDto, req: Request): Promise<import("./return-event.entity").ReturnEvent[]>;
    returnsForOrder(orderId: string): Promise<import("./return-event.entity").ReturnEvent[]>;
}
