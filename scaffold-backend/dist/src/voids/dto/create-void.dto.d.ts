import { VoidType } from '../void.entity';
export declare class CreateVoidDto {
    orderId?: string;
    type: VoidType;
    installer?: string;
    installedOn?: string;
    expiryDate?: string;
    notes?: string;
    attachments?: string[];
}
