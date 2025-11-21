export declare class AuditLog {
    id: string;
    entity: string;
    entityId?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    performedBy?: string;
    before?: any;
    after?: any;
    createdAt: Date;
}
