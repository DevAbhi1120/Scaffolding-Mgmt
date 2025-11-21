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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let DashboardService = class DashboardService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async totalClients() {
        const res = await this.dataSource.query('SELECT COUNT(*) as cnt FROM builders');
        return Number(res?.[0]?.cnt ?? 0);
    }
    async totalUsers() {
        const res = await this.dataSource.query('SELECT COUNT(*) as cnt FROM users');
        return Number(res?.[0]?.cnt ?? 0);
    }
    async jobsSummary() {
        const totalRes = await this.dataSource.query('SELECT COUNT(*) as cnt FROM orders');
        const ongoingRes = await this.dataSource.query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'OPEN'");
        const closedRes = await this.dataSource.query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'CLOSED'");
        return {
            total: Number(totalRes?.[0]?.cnt ?? 0),
            ongoing: Number(ongoingRes?.[0]?.cnt ?? 0),
            closed: Number(closedRes?.[0]?.cnt ?? 0)
        };
    }
    async totalPaymentBalance() {
        const invRes = await this.dataSource.query('SELECT IFNULL(SUM(total),0) as total FROM invoices');
        const payRes = await this.dataSource.query('SELECT IFNULL(SUM(amount),0) as paid FROM payments');
        const invTotal = Number(invRes?.[0]?.total ?? 0);
        const paid = Number(payRes?.[0]?.paid ?? 0);
        return Number((invTotal - paid).toFixed(2));
    }
    async jobsList(start, end, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const params = [];
        let where = '1=1';
        if (start) {
            where += ' AND o.createdAt >= ?';
            params.push(start);
        }
        if (end) {
            where += ' AND o.createdAt <= ?';
            params.push(end);
        }
        params.push(limit, offset);
        const sql = `
      SELECT o.id, o.status, o.startDate, o.closeDate, o.createdAt,
             b.id as builderId, b.businessName, b.businessAddress
      FROM orders o
      LEFT JOIN builders b ON b.id = o.builderId
      WHERE ${where}
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `;
        const items = await this.dataSource.query(sql, params);
        const countSql = `SELECT COUNT(*) as cnt FROM orders o WHERE ${where}`;
        const countParams = params.slice(0, params.length - 2);
        const totalRes = await this.dataSource.query(countSql, countParams);
        const total = Number(totalRes?.[0]?.cnt ?? 0);
        return { items, total, page, limit };
    }
    async paymentsReceived(start, end, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const params = [];
        let where = '1=1';
        if (start) {
            where += ' AND createdAt >= ?';
            params.push(start);
        }
        if (end) {
            where += ' AND createdAt <= ?';
            params.push(end);
        }
        params.push(limit, offset);
        const sql = `SELECT id, invoiceId, builderId, amount, method, reference, createdAt FROM payments WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        const items = await this.dataSource.query(sql, params);
        const countSql = `SELECT COUNT(*) as cnt FROM payments WHERE ${where}`;
        const countParams = params.slice(0, params.length - 2);
        const totalRes = await this.dataSource.query(countSql, countParams);
        const total = Number(totalRes?.[0]?.cnt ?? 0);
        const sumSql = `SELECT IFNULL(SUM(amount),0) as totalReceived FROM payments WHERE ${where}`;
        const sumRes = await this.dataSource.query(sumSql, countParams);
        const totalReceived = Number(sumRes?.[0]?.totalReceived ?? 0);
        return { items, total, page, limit, totalReceived };
    }
    async fullSummary() {
        const [clients, users, jobs, balance] = await Promise.all([
            this.totalClients(),
            this.totalUsers(),
            this.jobsSummary(),
            this.totalPaymentBalance()
        ]);
        return {
            totalClients: clients,
            totalUsers: users,
            jobsSummary: jobs,
            totalPaymentBalance: balance
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map