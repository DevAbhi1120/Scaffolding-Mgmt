import { Notification } from './notification.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
export declare class NotificationsService {
    private cfg;
    private notificationRepo;
    private dataSource;
    private readonly logger;
    private smtpTransporter?;
    private twilioClient?;
    private queue;
    private leadDays;
    constructor(cfg: ConfigService, notificationRepo: Repository<Notification>, dataSource: DataSource);
    findDueOrdersAndEnqueue(): Promise<void>;
    markAsSent(id: string, resultMessage?: string): Promise<void>;
    markAsFailed(id: string, resultMessage?: string): Promise<void>;
    sendEmail(to: string, subject: string, text: string, html?: string): Promise<any>;
    sendSms(to: string, body: string): Promise<import("twilio/lib/rest/api/v2010/account/message").MessageInstance>;
    enqueueNotificationForOrder(orderId: string): Promise<{
        ok: boolean;
        reason: string;
        notificationId?: undefined;
        recipients?: undefined;
    } | {
        ok: boolean;
        notificationId: string;
        recipients: {
            email: string | undefined;
            phone: string | undefined;
        };
        reason?: undefined;
    }>;
    enqueueEmailNotification(recipientEmail: string, subject: string, text: string, entityType?: string, entityId?: string): Promise<Notification>;
}
