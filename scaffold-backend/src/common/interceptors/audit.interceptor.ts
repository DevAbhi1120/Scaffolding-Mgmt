import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const user = (req as any).user;
    const performedBy = user ? user.userId ?? user.id : null;
    const path = req.route?.path ?? req.path;
    const entity = this.getEntityFromPath(path);

    const before = method === 'PUT' || method === 'DELETE' ? undefined : undefined;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          if (!entity) return;
          if (method === 'POST') {
            await this.audit.record(entity, result?.id ?? null, 'CREATE', performedBy, null, result);
          } else if (method === 'PUT' || method === 'PATCH') {
            await this.audit.record(entity, result?.id ?? null, 'UPDATE', performedBy, null, result);
          } else if (method === 'DELETE') {
            await this.audit.record(entity, req.params?.id ?? null, 'DELETE', performedBy, null, null);
          }
        } catch (e) {
          console.warn('AuditInterceptor error', (e as any)?.message ?? e);
        }
      })
    );
  }


  private getEntityFromPath(path: string | undefined): string | null {
    if (!path) return null;
    if (path.includes('orders')) return 'orders';
    if (path.includes('voids')) return 'void_protections';
    if (path.includes('swms')) return 'swms';
    if (path.includes('checklists')) return 'safety_checklists';
    if (path.includes('files')) return 'files';
    if (path.includes('invoices')) return 'invoices';
    return null;
  }
}
