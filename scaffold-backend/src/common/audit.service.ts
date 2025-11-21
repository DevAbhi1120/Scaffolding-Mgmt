import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async record(entity: string, entityId: string | null, action: 'CREATE' | 'UPDATE' | 'DELETE', performedBy?: string, before?: any, after?: any) {
    const rec = this.repo.create({
      entity,
      entityId: entityId ?? null,
      action,
      performedBy: performedBy ?? null,
      before: before ?? null,
      after: after ?? null
    } as any);
    return this.repo.save(rec);
  }
}
