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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    async lostDamagedSummary({ from, to } = {}) {
        const qb = this.dataSource.createQueryBuilder()
            .select('p.id', 'productId')
            .addSelect('p.name', 'productName')
            .addSelect('COUNT(CASE WHEN i.condition = \'LOST\' THEN 1 END)', 'lostCount')
            .addSelect('COUNT(CASE WHEN i.condition = \'DAMAGED\' THEN 1 END)', 'damagedCount')
            .addSelect('SUM(i.lostFee)', 'totalLostFees')
            .addSelect('SUM(i.damageFee)', 'totalDamageFees')
            .from('inventory_items', 'i')
            .leftJoin('products', 'p', 'p.id = i.productId');
        if (from)
            qb.andWhere('i.createdAt >= :from', { from });
        if (to)
            qb.andWhere('i.createdAt <= :to', { to });
        qb.groupBy('p.id, p.name');
        const rows = await qb.getRawMany();
        return rows;
    }
    async ordersReport(q) {
        const page = q.page && q.page > 0 ? q.page : 1;
        const limit = q.limit && q.limit > 0 ? q.limit : 50;
        const offset = (page - 1) * limit;
        const params = [];
        let where = '1=1';
        if (q.from) {
            where += ' AND o.createdAt >= ?';
            params.push(q.from);
        }
        if (q.to) {
            where += ' AND o.createdAt <= ?';
            params.push(q.to);
        }
        if (q.status) {
            where += ' AND o.status = ?';
            params.push(q.status);
        }
        if (q.businessName) {
            where += ' AND b.businessName LIKE ?';
            params.push(`%${q.businessName}%`);
        }
        if (q.businessAddress) {
            where += ' AND b.businessAddress LIKE ?';
            params.push(`%${q.businessAddress}%`);
        }
        const sql = `
      SELECT o.id as orderId, o.status, o.startDate, o.closeDate, o.createdAt,
             b.id as builderId, b.businessName, b.businessAddress,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) as itemCount
      FROM orders o
      LEFT JOIN builders b ON b.id = o.builderId
      WHERE ${where}
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `;
        params.push(limit, offset);
        const items = await this.dataSource.query(sql, params);
        const countSql = `SELECT COUNT(*) as cnt FROM orders o LEFT JOIN builders b ON b.id = o.builderId WHERE ${where}`;
        const totalRes = await this.dataSource.query(countSql, params.slice(0, params.length - 2));
        const total = Number(totalRes?.[0]?.cnt ?? 0);
        return { items, total, page, limit };
    }
    async inventoryReport(q) {
        const page = q.page && q.page > 0 ? q.page : 1;
        const limit = q.limit && q.limit > 0 ? q.limit : 50;
        const offset = (page - 1) * limit;
        const params = [];
        let where = '1=1';
        if (q.productName) {
            where += ' AND p.name LIKE ?';
            params.push(`%${q.productName}%`);
        }
        if (q.categoryId) {
            where += ' AND p.categoryId = ?';
            params.push(q.categoryId);
        }
        const sql = `
      SELECT p.id as productId, p.name as productName, p.productType, c.name as categoryName,
        IFNULL(m.balance,0) as movementBalance,
        IFNULL(item_count.in_store,0) as inStoreCount
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.categoryId
      LEFT JOIN (
        SELECT m.productId,
               SUM(CASE WHEN m.movementType = 'IN' THEN m.quantity WHEN m.movementType = 'OUT' THEN -m.quantity ELSE 0 END) AS balance
        FROM inventory_movements m
        GROUP BY m.productId
      ) m ON m.productId = p.id
      LEFT JOIN (
        SELECT i.productId, SUM(CASE WHEN i.status = 'IN_STORE' THEN 1 ELSE 0 END) AS in_store
        FROM inventory_items i
        GROUP BY i.productId
      ) item_count ON item_count.productId = p.id
      WHERE ${where}
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `;
        params.push(limit, offset);
        const items = await this.dataSource.query(sql, params);
        const countSql = `SELECT COUNT(*) as cnt FROM products p WHERE ${where}`;
        const totalRes = await this.dataSource.query(countSql, params.slice(0, params.length - 2));
        const total = Number(totalRes?.[0]?.cnt ?? 0);
        return { items, total, page, limit };
    }
    async customersReport(q) {
        const page = q.page && q.page > 0 ? q.page : 1;
        const limit = q.limit && q.limit > 0 ? q.limit : 50;
        const offset = (page - 1) * limit;
        const params = [];
        let where = '1=1';
        if (q.search) {
            where += ' AND (businessName LIKE ? OR businessAddress LIKE ?)';
            params.push(`%${q.search}%`, `%${q.search}%`);
        }
        const sql = `
      SELECT id as builderId, businessName, businessAddress, contactEmail, contactPhone, createdAt
      FROM builders
      WHERE ${where}
      ORDER BY businessName
      LIMIT ? OFFSET ?
    `;
        params.push(limit, offset);
        const items = await this.dataSource.query(sql, params);
        const countSql = `SELECT COUNT(*) as cnt FROM builders WHERE ${where}`;
        const totalRes = await this.dataSource.query(countSql, params.slice(0, params.length - 2));
        const total = Number(totalRes?.[0]?.cnt ?? 0);
        return { items, total, page, limit };
    }
    async ledgerReport(builderId, q) {
        const page = q.page && q.page > 0 ? q.page : 1;
        const limit = q.limit && q.limit > 0 ? q.limit : 100;
        const offset = (page - 1) * limit;
        const sql = `
      SELECT id, type, amount, date, notes
      FROM payments
      WHERE builderId = ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;
        const items = await this.dataSource.query(sql, [builderId, limit, offset]);
        const countRes = await this.dataSource.query(`SELECT COUNT(*) as cnt FROM payments WHERE builderId = ?`, [builderId]);
        const total = Number(countRes?.[0]?.cnt ?? 0);
        const balRes = await this.dataSource.query(`SELECT SUM(amount) as balance FROM payments WHERE builderId = ?`, [builderId]);
        const balance = Number(balRes?.[0]?.balance ?? 0);
        return { items, total, page, limit, balance };
    }
    async productInventoryControl({ productId, from, to, builderId }) {
        if (!from || !to)
            throw new common_1.BadRequestException('from and to dates are required (ISO format)');
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
            throw new common_1.BadRequestException('from/to must be valid dates');
        try {
            const tableExists = await this.tableExists('inventory_movements');
            if (tableExists) {
                return await this._productInventoryUsingMovements(productId, fromDate, toDate, builderId);
            }
            else {
                this.logger.debug('inventory_movements table not found — falling back to item-level aggregation');
                return await this._productInventoryFallback(productId, fromDate, toDate, builderId);
            }
        }
        catch (e) {
            this.logger.warn('Movement-based inventory query failed — falling back: ' + String(e));
            return await this._productInventoryFallback(productId, fromDate, toDate, builderId);
        }
    }
    async tableExists(tableName) {
        const where = this.dataSource.options.type === 'mysql' || this.dataSource.options.type === 'mariadb'
            ? `TABLE_NAME = '${tableName}' AND TABLE_SCHEMA = DATABASE()`
            : `table_name = '${tableName}'`;
        const sql = this.dataSource.options.type === 'mysql' || this.dataSource.options.type === 'mariadb'
            ? `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE ${where}`
            : `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE ${where}`;
        const res = await this.dataSource.query(sql);
        const cnt = Number(res?.[0]?.cnt ?? res?.[0]?.count ?? 0);
        return cnt > 0;
    }
    async _productInventoryUsingMovements(productId, fromDate, toDate, builderId) {
        const params = [];
        const whereClauses = [];
        if (productId) {
            whereClauses.push('m.productId = ?');
            params.push(productId);
        }
        if (builderId) {
            whereClauses.push('m.builderId = ?');
            params.push(builderId);
        }
        const where = whereClauses.length ? 'AND ' + whereClauses.join(' AND ') : '';
        let productListSql = '';
        if (productId) {
            productListSql = `SELECT p.id AS productId, p.name AS productName FROM products p WHERE p.id = ?`;
        }
        else {
            productListSql = `SELECT DISTINCT m.productId AS productId, p.name AS productName FROM inventory_movements m LEFT JOIN products p ON p.id = m.productId WHERE 1=1 ${where}`;
        }
        const productRows = await this.dataSource.query(productListSql, productId ? [productId] : params);
        if (!productRows || productRows.length === 0) {
            return this._productInventoryFallback(productId, fromDate, toDate, builderId);
        }
        const rows = [];
        for (const prod of productRows) {
            const pid = prod.productId;
            const openingSql = `
        SELECT
          SUM(CASE WHEN m.type IN ('IN') THEN m.quantity ELSE 0 END) as in_before,
          SUM(CASE WHEN m.type IN ('OUT','ASSIGN') THEN m.quantity ELSE 0 END) as out_before
        FROM inventory_movements m
        WHERE m.productId = ? AND m.createdAt < ?
      `;
            const opening = await this.dataSource.query(openingSql, [pid, fromDate.toISOString()]);
            const inBefore = Number(opening?.[0]?.in_before ?? 0);
            const outBefore = Number(opening?.[0]?.out_before ?? 0);
            const openingStock = inBefore - outBefore;
            const rangeSql = `
        SELECT
          SUM(CASE WHEN m.type IN ('IN') THEN m.quantity ELSE 0 END) as in_range,
          SUM(CASE WHEN m.type IN ('OUT','ASSIGN') THEN m.quantity ELSE 0 END) as out_range
        FROM inventory_movements m
        WHERE m.productId = ? AND m.createdAt BETWEEN ? AND ?
      `;
            const range = await this.dataSource.query(rangeSql, [pid, fromDate.toISOString(), toDate.toISOString()]);
            const inRange = Number(range?.[0]?.in_range ?? 0);
            const outRange = Number(range?.[0]?.out_range ?? 0);
            const damagedSql = `SELECT COUNT(*) as cnt, COALESCE(SUM(CASE WHEN damageFee IS NOT NULL THEN damageFee ELSE 0 END),0) as fees FROM inventory_items i WHERE i.productId = ? AND i.condition = 'DAMAGED'`;
            const lostSql = `SELECT COUNT(*) as cnt, COALESCE(SUM(CASE WHEN lostFee IS NOT NULL THEN lostFee ELSE 0 END),0) as fees FROM inventory_items i WHERE i.productId = ? AND i.condition = 'LOST'`;
            const damaged = await this.dataSource.query(damagedSql, [pid]);
            const lost = await this.dataSource.query(lostSql, [pid]);
            const damagedCount = Number(damaged?.[0]?.cnt ?? 0);
            const damagedFees = Number(damaged?.[0]?.fees ?? 0);
            const lostCount = Number(lost?.[0]?.cnt ?? 0);
            const lostFees = Number(lost?.[0]?.fees ?? 0);
            const balance = openingStock + inRange - outRange - damagedCount - lostCount;
            rows.push({
                productId: pid,
                productName: prod.productName ?? null,
                openingStock,
                stockIn: inRange,
                stockOut: outRange,
                damagedCount,
                damagedFees,
                lostCount,
                lostFees,
                balance
            });
        }
        return rows;
    }
    async _productInventoryFallback(productId, fromDate, toDate, builderId) {
        const params = [];
        let baseWhere = '1=1';
        if (productId) {
            baseWhere += ' AND i.productId = ?';
            params.push(productId);
        }
        if (builderId) {
            baseWhere += ' AND i.builderId = ?';
            params.push(builderId);
        }
        const prodSql = productId
            ? `SELECT p.id as productId, p.name as productName FROM products p WHERE p.id = ?`
            : `SELECT DISTINCT i.productId as productId, p.name as productName FROM inventory_items i LEFT JOIN products p ON p.id = i.productId WHERE ${baseWhere}`;
        const prodRows = await this.dataSource.query(prodSql, productId ? [productId] : params);
        if (!prodRows || prodRows.length === 0) {
            return [];
        }
        const rows = [];
        for (const prod of prodRows) {
            const pid = prod.productId;
            const openingSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.createdAt < ? AND (i.deletedAt IS NULL)
      `;
            const openingRes = await this.dataSource.query(openingSql, [pid, fromDate.toISOString()]);
            const openingStock = Number(openingRes?.[0]?.cnt ?? 0);
            const inSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.createdAt BETWEEN ? AND ? AND (i.deletedAt IS NULL)
      `;
            const inRes = await this.dataSource.query(inSql, [pid, fromDate.toISOString(), toDate.toISOString()]);
            const stockIn = Number(inRes?.[0]?.cnt ?? 0);
            const outSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.assignedToOrderId IS NOT NULL
          AND i.createdAt <= ?
      `;
            const outRes = await this.dataSource.query(outSql, [pid, toDate.toISOString()]);
            const stockOut = Number(outRes?.[0]?.cnt ?? 0);
            const damagedSql = `SELECT COUNT(*) as cnt, COALESCE(SUM(CASE WHEN damageFee IS NOT NULL THEN damageFee ELSE 0 END),0) as fees FROM inventory_items i WHERE i.productId = ? AND i.condition = 'DAMAGED'`;
            const lostSql = `SELECT COUNT(*) as cnt, COALESCE(SUM(CASE WHEN lostFee IS NOT NULL THEN lostFee ELSE 0 END),0) as fees FROM inventory_items i WHERE i.productId = ? AND i.condition = 'LOST'`;
            const damaged = await this.dataSource.query(damagedSql, [pid]);
            const lost = await this.dataSource.query(lostSql, [pid]);
            const damagedCount = Number(damaged?.[0]?.cnt ?? 0);
            const damagedFees = Number(damaged?.[0]?.fees ?? 0);
            const lostCount = Number(lost?.[0]?.cnt ?? 0);
            const lostFees = Number(lost?.[0]?.fees ?? 0);
            const balance = openingStock + stockIn - stockOut - damagedCount - lostCount;
            rows.push({
                productId: pid,
                productName: prod.productName ?? null,
                openingStock,
                stockIn,
                stockOut,
                damagedCount,
                damagedFees,
                lostCount,
                lostFees,
                balance
            });
        }
        return rows;
    }
    async productInventoryControlCsv(params) {
        const rows = await this.productInventoryControl(params);
        const headers = ['productId', 'productName', 'openingStock', 'stockIn', 'stockOut', 'damagedCount', 'damagedFees', 'lostCount', 'lostFees', 'balance'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const line = headers.map((h) => {
                const v = r[h];
                if (v === null || v === undefined)
                    return '';
                const s = String(v).replace(/"/g, '""');
                if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0)
                    return `"${s}"`;
                return s;
            }).join(',');
            lines.push(line);
        }
        return lines.join('\n');
    }
    toCSV(columns, rows) {
        const esc = (v) => {
            if (v === null || v === undefined)
                return '';
            const s = String(v);
            if (s.includes('"') || s.includes(',') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        const header = columns.join(',') + '\n';
        const lines = rows.map((r) => columns.map((c) => esc(r[c])).join(',')).join('\n');
        return header + lines;
    }
    toSimpleHtmlReport(title, columns, rows) {
        const ths = columns.map((c) => `<th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">${c}</th>`).join('');
        const trs = rows
            .map((r) => `<tr>${columns
            .map((c) => `<td style="padding:6px;border-bottom:1px solid #eee">${String(r[c] ?? '')}</td>`)
            .join('')}</tr>`)
            .join('');
        return `
      <html>
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body style="font-family:Arial,Helvetica,sans-serif;font-size:12px">
          <h2>${title}</h2>
          <table style="width:100%;border-collapse:collapse">${ths}${trs}</table>
        </body>
      </html>
    `;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map