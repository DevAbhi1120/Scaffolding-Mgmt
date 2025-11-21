import { Order } from './order.entity';
export declare class Swms {
    id: string;
    orderId?: string | null;
    order?: Order | null;
    submittedBy?: string | null;
    swmsData: any;
    highRiskTasks: any[];
    attachments?: string[];
    editableByAdmin?: boolean;
    createdAt: Date;
}
