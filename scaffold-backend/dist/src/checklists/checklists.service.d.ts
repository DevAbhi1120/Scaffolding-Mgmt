import { Repository, DataSource } from 'typeorm';
import { SafetyChecklist } from './safety_checklist.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { NotificationsService } from '../notifications/notification.service';
export declare class ChecklistsService {
    private dataSource;
    private repo;
    private notificationsSvc;
    constructor(dataSource: DataSource, repo: Repository<SafetyChecklist>, notificationsSvc: NotificationsService);
    create(dto: CreateChecklistDto): Promise<SafetyChecklist>;
    findByOrder(orderId: string): Promise<SafetyChecklist[]>;
    get(id: string): Promise<SafetyChecklist>;
    search(filters: {
        orderId?: string;
        builderId?: string;
        from?: string;
        to?: string;
        search?: string;
    }): Promise<SafetyChecklist[]>;
}
