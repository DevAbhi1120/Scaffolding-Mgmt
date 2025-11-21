import { NotificationsService } from './notification.service';
export declare class NotificationsController {
    private svc;
    constructor(svc: NotificationsService);
    enqueueForOrder(orderId: string): Promise<{
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
}
