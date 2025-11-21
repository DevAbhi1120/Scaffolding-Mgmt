export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    BOTH = "BOTH"
}
export declare enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED"
}
export declare class Notification {
    id: string;
    entityType: string;
    entityId: string;
    type: NotificationType;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    status: NotificationStatus;
    payload?: string;
    resultMessage?: string;
    createdAt: Date;
}
