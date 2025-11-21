import { Repository, DataSource } from 'typeorm';
import { VoidProtection } from './void.entity';
import { CreateVoidDto } from './dto/create-void.dto';
import { UpdateVoidDto } from './dto/update-void.dto';
import { NotificationsService } from '../notifications/notification.service';
export declare class VoidsService {
    private dataSource;
    private repo;
    private notificationsSvc;
    constructor(dataSource: DataSource, repo: Repository<VoidProtection>, notificationsSvc: NotificationsService);
    create(dto: CreateVoidDto): Promise<VoidProtection>;
    get(id: string): Promise<VoidProtection>;
    findByOrder(orderId: string): Promise<VoidProtection[]>;
    update(id: string, dto: UpdateVoidDto): Promise<VoidProtection>;
    findExpiring(days?: number): Promise<VoidProtection[]>;
}
