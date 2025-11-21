import { DataSource } from 'typeorm';
import { NotificationsService } from './notification.service';
import { ConfigService } from '@nestjs/config';
export declare class NotificationProcessor {
    private dataSource;
    private cfg;
    private notificationsService;
    private worker;
    private logger;
    constructor(dataSource: DataSource, cfg: ConfigService, notificationsService: NotificationsService);
}
