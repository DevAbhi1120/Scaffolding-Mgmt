import { Order } from './order.entity';
export declare class SafetyChecklist {
    id: string;
    orderId?: string | null;
    order?: Order | null;
    submittedBy?: string | null;
    checklistData: any;
    dateOfCheck: Date;
    attachments?: string[];
    preserved?: boolean;
    createdAt: Date;
}
