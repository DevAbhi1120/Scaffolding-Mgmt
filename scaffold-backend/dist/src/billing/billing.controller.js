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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const update_payment_dto_1 = require("./dto/update-payment.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let BillingController = class BillingController {
    constructor(svc) {
        this.svc = svc;
    }
    async sendHtmlOrPdf(res, html, filenamePrefix, format) {
        if (format === 'pdf') {
            try {
                const puppeteer = require('puppeteer');
                const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
                const page = await browser.newPage();
                await page.setContent(html, { waitUntil: 'networkidle0' });
                const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
                await browser.close();
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filenamePrefix}.pdf"`);
                return res.send(pdfBuffer);
            }
            catch (e) {
                res.setHeader('Content-Type', 'text/html');
                return res.send(html);
            }
        }
        else {
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        }
    }
    async createInvoice(dto) {
        return this.svc.createInvoice(dto);
    }
    async getInvoice(id) {
        return this.svc.getInvoice(id);
    }
    async printInvoice(id, format, res) {
        const html = await this.svc.invoicePrintHtml(id);
        return this.sendHtmlOrPdf(res, html, `invoice_${id}`, format);
    }
    async invoiceVoucher(id, format, res) {
        const html = await this.svc.invoicePrintHtml(id);
        return this.sendHtmlOrPdf(res, html, `voucher_${id}`, format);
    }
    async invoiceReceipt(id, format, res) {
        const html = await this.svc.invoicePrintHtml(id);
        return this.sendHtmlOrPdf(res, html, `receipt_${id}`, format);
    }
    async createPayment(dto) {
        return this.svc.createPayment(dto);
    }
    async updatePayment(id, dto) {
        return this.svc.updatePayment(id, dto);
    }
    async paymentsForBuilder(builderId, page, limit) {
        return this.svc.paymentsForBuilder(builderId, Number(page) || 1, Number(limit) || 50);
    }
    async createAdvancePayment(body) {
        return this.svc.createAdvancePayment(body);
    }
    async applyPayment(invoiceId, body) {
        return this.svc.applyPaymentToInvoice(invoiceId, body);
    }
    async getLedger(builderId) {
        return this.svc.getCustomerLedger(builderId);
    }
    async getLedgerPdf(builderId, res, format) {
        const out = await this.svc.ledgerPrintPdf(builderId);
        if (Buffer.isBuffer(out)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ledger_${builderId}.pdf"`);
            return res.send(out);
        }
        else {
            res.setHeader('Content-Type', 'text/html');
            return res.send(out);
        }
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('invoices'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)('invoices/:id/print'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "printInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/voucher'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "invoiceVoucher", null);
__decorate([
    (0, common_1.Post)('invoices/:id/receipt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "invoiceReceipt", null);
__decorate([
    (0, common_1.Post)('payments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Put)('payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_payment_dto_1.UpdatePaymentDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.Get)('payments/builder/:builderId'),
    __param(0, (0, common_1.Param)('builderId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "paymentsForBuilder", null);
__decorate([
    (0, common_1.Post)('payments/advance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createAdvancePayment", null);
__decorate([
    (0, common_1.Post)('invoices/:id/apply-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "applyPayment", null);
__decorate([
    (0, common_1.Get)('ledger/:builderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('builderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Get)('ledger/:builderId/pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('builderId')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getLedgerPdf", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map