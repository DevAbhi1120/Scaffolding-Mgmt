import { Swms } from '../database/entities/swms.entity';
import { Repository } from 'typeorm';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { NotificationsService } from '../notifications/notification.service';
export declare class SwmsService {
    private repo;
    private notificationsSvc;
    constructor(repo: Repository<Swms>, notificationsSvc: NotificationsService);
    create(dto: CreateSwmsDto): Promise<Swms>;
    findByOrder(orderId: string): Promise<Swms[]>;
    get(id: string): Promise<Swms>;
    update(id: string, dto: UpdateSwmsDto, isAdmin?: boolean): Promise<Swms>;
}
