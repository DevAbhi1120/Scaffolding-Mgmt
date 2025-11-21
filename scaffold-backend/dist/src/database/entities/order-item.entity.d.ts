import { Product } from './product.entity';
import { Order } from './order.entity';
export declare class OrderItem {
    id: string;
    orderId: string;
    order: Order;
    productId: string;
    product: Product;
    quantity: number;
    serialNumbers?: string[];
    unitPrice?: number;
    description?: string;
    createdAt: Date;
}
