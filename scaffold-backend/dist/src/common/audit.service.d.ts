import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private repo;
    constructor(repo: Repository<AuditLog>);
    record(entity: string, entityId: string | null, action: 'CREATE' | 'UPDATE' | 'DELETE', performedBy?: string, before?: any, after?: any): Promise<AuditLog[]>;
}
