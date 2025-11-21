import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditService } from '../audit.service';
export declare class AuditInterceptor implements NestInterceptor {
    private audit;
    constructor(audit: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private getEntityFromPath;
}
