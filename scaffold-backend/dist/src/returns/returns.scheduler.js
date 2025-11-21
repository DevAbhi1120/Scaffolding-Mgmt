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
var ReturnsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
const returns_service_1 = require("./returns.service");
let ReturnsScheduler = ReturnsScheduler_1 = class ReturnsScheduler {
    constructor(ds, returnsService) {
        this.ds = ds;
        this.returnsService = returnsService;
        this.logger = new common_1.Logger(ReturnsScheduler_1.name);
    }
    async dailyLateReturnCheck() {
        this.logger.log('Running late return check');
        const rows = await this.ds
            .createQueryBuilder()
            .select('o.id', 'orderId')
            .addSelect('o.closeDate', 'closeDate')
            .from('orders', 'o')
            .where('o.closeDate IS NOT NULL')
            .andWhere('o.closeDate < NOW()')
            .getRawMany();
        for (const row of rows) {
            const orderId = row.orderId;
            const closeDate = new Date(row.closeDate);
            try {
                const invoices = await this.returnsService.invoiceLateReturnsForOrder(orderId, closeDate);
                if (invoices && invoices.length > 0) {
                    this.logger.log(`Created ${invoices.length} late-return invoices for order ${orderId}`);
                }
            }
            catch (e) {
                this.logger.warn(`Failed to process late returns for order ${orderId}: ${String(e)}`);
            }
        }
    }
};
exports.ReturnsScheduler = ReturnsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReturnsScheduler.prototype, "dailyLateReturnCheck", null);
exports.ReturnsScheduler = ReturnsScheduler = ReturnsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, returns_service_1.ReturnsService])
], ReturnsScheduler);
//# sourceMappingURL=returns.scheduler.js.map