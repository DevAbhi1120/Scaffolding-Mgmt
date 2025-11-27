import { Repository, DataSource } from 'typeorm';
import { SafetyChecklist } from '../database/entities/safety-checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { NotificationsService } from '../notifications/notification.service';
import { Order } from '../database/entities/order.entity';
export declare class ChecklistsService {
    private dataSource;
    private repo;
    private notificationsSvc;
    constructor(dataSource: DataSource, repo: Repository<SafetyChecklist>, notificationsSvc: NotificationsService);
    create(dto: CreateChecklistDto): Promise<SafetyChecklist>;
    update(id: string, dto: Partial<CreateChecklistDto> & {
        existingAttachments?: string[];
    }): Promise<{
        orderId: string | null | undefined;
        submittedBy: string | null | undefined;
        checklistData: any;
        dateOfCheck: Date;
        attachments: string[];
        preserved: boolean | undefined;
        id: string;
        order?: Order | null;
        createdAt: Date;
    } & SafetyChecklist>;
    findByOrder(orderId: string): Promise<SafetyChecklist[]>;
    get(id: string): Promise<SafetyChecklist>;
    search(filters: {
        orderId?: string;
        builderId?: string;
        from?: string;
        to?: string;
        search?: string;
    }): Promise<SafetyChecklist[]>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
