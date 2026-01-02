import { Swms } from '../database/entities/swms.entity';
import { Repository } from 'typeorm';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { NotificationsService } from '../notifications/notification.service';
export declare class SwmsService {
    private repo;
    private notificationsSvc;
    private s3;
    private bucket;
    private isS3Enabled;
    constructor(repo: Repository<Swms>, notificationsSvc: NotificationsService);
    private ensureUploadsFolder;
    private uploadFile;
    private deleteFile;
    create(dto: CreateSwmsDto & {
        files?: Express.Multer.File[];
    }): Promise<Swms>;
    update(id: string, dto: UpdateSwmsDto & {
        newFiles?: Express.Multer.File[];
    }, isAdmin?: boolean): Promise<Swms>;
    get(id: string): Promise<Swms>;
    listAll(): Promise<Swms[]>;
    findByOrder(orderId: string): Promise<Swms[]>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
