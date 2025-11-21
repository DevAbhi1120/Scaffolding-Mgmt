import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private svc;
    constructor(svc: OrdersService);
    create(dto: CreateOrderDto): Promise<import("../database/entities/order.entity").Order | null>;
    list(page?: number, limit?: number): Promise<{
        items: import("../database/entities/order.entity").Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<import("../database/entities/order.entity").Order | null>;
}
