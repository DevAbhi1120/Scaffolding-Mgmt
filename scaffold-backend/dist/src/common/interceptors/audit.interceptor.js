"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../audit.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(audit) {
        this.audit = audit;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const user = req.user;
        const performedBy = user ? user.userId ?? user.id : null;
        const path = req.route?.path ?? req.path;
        const entity = this.getEntityFromPath(path);
        const before = method === 'PUT' || method === 'DELETE' ? undefined : undefined;
        return next.handle().pipe((0, operators_1.tap)(async (result) => {
            try {
                if (!entity)
                    return;
                if (method === 'POST') {
                    await this.audit.record(entity, result?.id ?? null, 'CREATE', performedBy, null, result);
                }
                else if (method === 'PUT' || method === 'PATCH') {
                    await this.audit.record(entity, result?.id ?? null, 'UPDATE', performedBy, null, result);
                }
                else if (method === 'DELETE') {
                    await this.audit.record(entity, req.params?.id ?? null, 'DELETE', performedBy, null, null);
                }
            }
            catch (e) {
                console.warn('AuditInterceptor error', e?.message ?? e);
            }
        }));
    }
    getEntityFromPath(path) {
        if (!path)
            return null;
        if (path.includes('orders'))
            return 'orders';
        if (path.includes('voids'))
            return 'void_protections';
        if (path.includes('swms'))
            return 'swms';
        if (path.includes('checklists'))
            return 'safety_checklists';
        if (path.includes('files'))
            return 'files';
        if (path.includes('invoices'))
            return 'invoices';
        return null;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map