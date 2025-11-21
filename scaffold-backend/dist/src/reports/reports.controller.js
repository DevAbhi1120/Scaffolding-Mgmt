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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(svc) {
        this.svc = svc;
    }
    async orders(query, res) {
        const { format } = query;
        const result = await this.svc.ordersReport(query);
        if (format === 'csv') {
            const columns = ['orderId', 'status', 'startDate', 'closeDate', 'createdAt', 'businessName', 'businessAddress', 'itemCount'];
            const csv = this.svc.toCSV(columns, result.items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="orders_report_${Date.now()}.csv"`);
            return res.send(csv);
        }
        return res.json(result);
    }
    async inventory(query, res) {
        const { format } = query;
        const result = await this.svc.inventoryReport(query);
        if (format === 'csv') {
            const columns = ['productId', 'productName', 'productType', 'categoryName', 'movementBalance', 'inStoreCount'];
            const csv = this.svc.toCSV(columns, result.items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${Date.now()}.csv"`);
            return res.send(csv);
        }
        return res.json(result);
    }
    async customers(query, res) {
        const { format } = query;
        const result = await this.svc.customersReport(query);
        if (format === 'csv') {
            const columns = ['builderId', 'businessName', 'businessAddress', 'contactEmail', 'contactPhone', 'createdAt'];
            const csv = this.svc.toCSV(columns, result.items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="customers_report_${Date.now()}.csv"`);
            return res.send(csv);
        }
        return res.json(result);
    }
    async ledger(builderId, query, res) {
        const { format } = query;
        const result = await this.svc.ledgerReport(builderId, query);
        if (format === 'csv') {
            const columns = ['id', 'type', 'amount', 'date', 'notes'];
            const csv = this.svc.toCSV(columns, result.items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="ledger_${builderId}_${Date.now()}.csv"`);
            return res.send(csv);
        }
        return res.json(result);
    }
    async ordersPdf(query, res) {
        const result = await this.svc.ordersReport(query);
        const columns = ['orderId', 'status', 'startDate', 'closeDate', 'createdAt', 'businessName', 'businessAddress', 'itemCount'];
        const html = this.svc.toSimpleHtmlReport('Orders Report', columns, result.items);
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="orders_report_${Date.now()}.pdf"`);
            return res.send(pdfBuffer);
        }
        catch (e) {
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        }
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "orders", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "inventory", null);
__decorate([
    (0, common_1.Get)('customers'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "customers", null);
__decorate([
    (0, common_1.Get)('ledger/:builderId'),
    __param(0, (0, common_1.Param)('builderId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "ledger", null);
__decorate([
    (0, common_1.Get)('orders/pdf'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "ordersPdf", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map