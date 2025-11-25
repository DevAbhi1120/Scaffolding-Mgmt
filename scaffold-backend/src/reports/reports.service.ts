import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryItem } from '../database/entities/inventory_item.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private dataSource: DataSource) { }

  // returns grouped summary: per builder => counts & fees
  async lostDamagedSummary({ from, to }: { from?: string; to?: string } = {}) {
    const qb = this.dataSource.createQueryBuilder()
      .select('p.id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('COUNT(CASE WHEN i.condition = \'LOST\' THEN 1 END)', 'lostCount')
      .addSelect('COUNT(CASE WHEN i.condition = \'DAMAGED\' THEN 1 END)', 'damagedCount')
      .addSelect('SUM(i.lostFee)', 'totalLostFees')
      .addSelect('SUM(i.damageFee)', 'totalDamageFees')
      .from('inventory_items', 'i')
      .leftJoin('products', 'p', 'p.id = i.productId');

    if (from) qb.andWhere('i.createdAt >= :from', { from });
    if (to) qb.andWhere('i.createdAt <= :to', { to });

    qb.groupBy('p.id, p.name');

    const rows = await qb.getRawMany();
    return rows;
  }

  // ORDERS report with filters
  // src/reports/reports.service.ts — REPLACE ordersReport() WITH THIS
  async ordersReport(q: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    businessName?: string;
    businessAddress?: string;
    status?: 'OPEN' | 'CLOSED';
    format?: 'json' | 'csv';
  }) {
    const page = q.page && q.page > 0 ? q.page : 1;
    const limit = q.limit && q.limit > 0 ? q.limit : 50;
    const offset = (page - 1) * limit;

    const qb = this.dataSource.createQueryBuilder()
      .select('o.id', 'orderId')
      .addSelect('o.status', 'status')
      .addSelect('o.startDate', 'startDate')
      .addSelect('o.closeDate', 'closeDate')
      .addSelect('o.createdAt', 'createdAt')
      .addSelect('b.id', 'builderId')
      .addSelect('b.businessName', 'businessName')
      .addSelect('b.businessAddress', 'businessAddress')
      .addSelect('COALESCE(item_counts.cnt, 0)', 'itemCount')
      .from('orders', 'o')
      .leftJoin('builders', 'b', 'b.id = o.builderId')
      .leftJoin(
        '(SELECT orderId, COUNT(*) as cnt FROM order_items GROUP BY orderId)',
        'item_counts',
        'item_counts.orderId = o.id'
      )
      .where('1 = 1');

    if (q.from) qb.andWhere('o.createdAt >= :from', { from: q.from });
    if (q.to) qb.andWhere('o.createdAt <= :to', { to: q.to });
    if (q.status) qb.andWhere('o.status = :status', { status: q.status });
    if (q.businessName) qb.andWhere('b.businessName LIKE :name', { name: `%${q.businessName}%` });
    if (q.businessAddress) qb.andWhere('b.businessAddress LIKE :addr', { addr: `%${q.businessAddress}%` });

    qb.orderBy('o.createdAt', 'DESC')
      .limit(limit)
      .offset(offset);

    const items = await qb.getRawMany();

    const countQb = this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'cnt')
      .from('orders', 'o')
      .leftJoin('builders', 'b', 'b.id = o.builderId')
      .where('1 = 1');

    if (q.from) countQb.andWhere('o.createdAt >= :from', { from: q.from });
    if (q.to) countQb.andWhere('o.createdAt <= :to', { to: q.to });
    if (q.status) countQb.andWhere('o.status = :status', { status: q.status });
    if (q.businessName) countQb.andWhere('b.businessName LIKE :name', { name: `%${q.businessName}%` });
    if (q.businessAddress) countQb.andWhere('b.businessAddress LIKE :addr', { addr: `%${q.businessAddress}%` });

    const totalRes = await countQb.getRawOne();
    const total = Number(totalRes?.cnt ?? 0);

    return { items, total, page, limit };
  }

  // INVENTORY report: product-wise balances + latest movements
  async inventoryReport(q: {
    page?: number;
    limit?: number;
    productName?: string;
    categoryId?: string;
    builderId?: string;
    format?: 'json' | 'csv';
  }) {
    const page = q.page && q.page > 0 ? q.page : 1;
    const limit = q.limit && q.limit > 0 ? q.limit : 50;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let where = '1=1';
    if (q.productName) {
      where += ' AND p.name LIKE ?';
      params.push(`%${q.productName}%`);
    }
    if (q.categoryId) {
      where += ' AND p.categoryId = ?';
      params.push(q.categoryId);
    }

    // Product-wise balance: compute from inventory_movements or inventory_items
    // Query products with aggregated movements
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

    // total count
    const countSql = `SELECT COUNT(*) as cnt FROM products p WHERE ${where}`;
    const totalRes = await this.dataSource.query(countSql, params.slice(0, params.length - 2));
    const total = Number(totalRes?.[0]?.cnt ?? 0);

    return { items, total, page, limit };
  }

  // CUSTOMERS / BUILDERS list
  async customersReport(q: { page?: number; limit?: number; search?: string; format?: 'json' | 'csv' }) {
    const page = q.page && q.page > 0 ? q.page : 1;
    const limit = q.limit && q.limit > 0 ? q.limit : 50;
    const offset = (page - 1) * limit;

    const params: any[] = [];
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

  // LEDGER for builder: payments/invoices/credits - expects a payments table or payments records
  // src/reports/reports.service.ts — FINAL WORKING VERSION
  async ledgerReport(builderId: string, q: { page?: number; limit?: number; format?: 'json' | 'csv' }) {
    const page = q.page && q.page > 0 ? q.page : 1;
    const limit = q.limit && q.limit > 0 ? q.limit : 100;
    const offset = (page - 1) * limit;

    const sql = `
    SELECT 
      id,
      method AS type,
      amount,
      createdAt AS date,
      notes,
      reference,
      status
    FROM payments
    WHERE builderId = ?
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;

    const items = await this.dataSource.query(sql, [builderId, limit, offset]);

    const countRes = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM payments WHERE builderId = ?`,
      [builderId]
    );
    const total = Number(countRes?.[0]?.cnt ?? 0);

    const balanceRes = await this.dataSource.query(
      `SELECT 
       COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as received,
       COALESCE(SUM(CASE WHEN status = 'REVERSED' THEN amount ELSE 0 END), 0) as reversed
     FROM payments WHERE builderId = ?`,
      [builderId]
    );
    const balance = Number(balanceRes?.[0]?.received ?? 0) - Number(balanceRes?.[0]?.reversed ?? 0);

    return {
      items,
      total,
      page,
      limit,
      balance,
      summary: {
        totalReceived: Number(balanceRes?.[0]?.received ?? 0),
        totalReversed: Number(balanceRes?.[0]?.reversed ?? 0),
      }
    };
  }

  /**
   * Product inventory control report
   * Params:
   * - productId (optional) : string
   * - from (ISO date) : string (required)
   * - to (ISO date) : string (required)
   * - builderId (optional) : string (filter results)
   *
   * Returns an array of rows (one per product if productId omitted, otherwise single row)
   *
   * Each row:
   * { productId, productName, openingStock, stockIn, stockOut, damagedCount, lostCount, balance }
   */
  async productInventoryControl({ productId, from, to, builderId }: { productId?: string; from: string; to: string; builderId?: string }) {
    if (!from || !to) throw new BadRequestException('from and to dates are required (ISO format)');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw new BadRequestException('from/to must be valid dates');
    // Try to use inventory_movements table if it exists for precise stock_in / stock_out
    try {
      const tableExists = await this.tableExists('inventory_movements');
      if (tableExists) {
        return await this._productInventoryUsingMovements(productId, fromDate, toDate, builderId);
      } else {
        this.logger.debug('inventory_movements table not found — falling back to item-level aggregation');
        return await this._productInventoryFallback(productId, fromDate, toDate, builderId);
      }
    } catch (e) {
      this.logger.warn('Movement-based inventory query failed — falling back: ' + String(e));
      return await this._productInventoryFallback(productId, fromDate, toDate, builderId);
    }
  }

  // Helper: check if a table exists in current DB
  private async tableExists(tableName: string) {
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

  // Movement-based precise computation
  private async _productInventoryUsingMovements(productId: string | undefined, fromDate: Date, toDate: Date, builderId?: string) {
    // movement types expected: 'IN', 'OUT', 'ASSIGN', 'RETURN', 'ADJUSTMENT'
    // we aggregate movements between dates for stock_in/stock_out
    // openingStock = total movements (IN - OUT) before `fromDate`
    // currentBalance = openingStock + movements between from..to
    // damaged/lost counts from inventory_items condition flags
    const params: any[] = [];
    const whereClauses: string[] = [];
    if (productId) {
      whereClauses.push('m.productId = ?');
      params.push(productId);
    }
    if (builderId) {
      whereClauses.push('m.builderId = ?');
      params.push(builderId);
    }
    const where = whereClauses.length ? 'AND ' + whereClauses.join(' AND ') : '';
    // aggregated list of products to report (either single product or all products seen in movements/items)
    let productListSql = '';
    if (productId) {
      productListSql = `SELECT p.id AS productId, p.name AS productName FROM products p WHERE p.id = ?`;
    } else {
      productListSql = `SELECT DISTINCT m.productId AS productId, p.name AS productName FROM inventory_movements m LEFT JOIN products p ON p.id = m.productId WHERE 1=1 ${where}`;
    }
    const productRows = await this.dataSource.query(productListSql, productId ? [productId] : params);
    if (!productRows || productRows.length === 0) {
      // fallback to items table
      return this._productInventoryFallback(productId, fromDate, toDate, builderId);
    }
    const rows = [];
    for (const prod of productRows) {
      const pid = prod.productId;
      // opening stock before fromDate
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
      // movements in range
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
      // damaged & lost counts from inventory_items
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

  // Fallback using inventory_items only (when inventory_movements not available)
  private async _productInventoryFallback(productId: string | undefined, fromDate: Date, toDate: Date, builderId?: string) {
    const params: any[] = [];
    let baseWhere = '1=1';
    if (productId) {
      baseWhere += ' AND i.productId = ?';
      params.push(productId);
    }
    if (builderId) {
      baseWhere += ' AND i.builderId = ?';
      params.push(builderId);
    }
    // list products to include
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
      // openingStock: items created before fromDate and not deleted
      const openingSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.createdAt < ? AND (i.deletedAt IS NULL)
      `;
      const openingRes = await this.dataSource.query(openingSql, [pid, fromDate.toISOString()]);
      const openingStock = Number(openingRes?.[0]?.cnt ?? 0);
      // stockIn: items created between from..to
      const inSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.createdAt BETWEEN ? AND ? AND (i.deletedAt IS NULL)
      `;
      const inRes = await this.dataSource.query(inSql, [pid, fromDate.toISOString(), toDate.toISOString()]);
      const stockIn = Number(inRes?.[0]?.cnt ?? 0);
      // stockOut: items assigned (assignedToOrderId set) and assigned createdAt between from..to
      // NOTE: if you do not have assignment timestamps, we approximate by counting items whose createdAt < toDate and assignedToOrderId NOT NULL
      const outSql = `
        SELECT COUNT(*) as cnt
        FROM inventory_items i
        WHERE i.productId = ? AND i.assignedToOrderId IS NOT NULL
          AND i.createdAt <= ?
      `;
      const outRes = await this.dataSource.query(outSql, [pid, toDate.toISOString()]);
      const stockOut = Number(outRes?.[0]?.cnt ?? 0);
      // damaged / lost
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

  // Helper: produce CSV string from rows
  async productInventoryControlCsv(params: { productId?: string; from: string; to: string; builderId?: string }) {
    const rows = await this.productInventoryControl(params);
    const headers = ['productId', 'productName', 'openingStock', 'stockIn', 'stockOut', 'damagedCount', 'damagedFees', 'lostCount', 'lostFees', 'balance'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const line = headers.map((h) => {
        const v = (r as any)[h];
        if (v === null || v === undefined) return '';
        // escape commas/quotes
        const s = String(v).replace(/"/g, '""');
        if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0) return `"${s}"`;
        return s;
      }).join(',');
      lines.push(line);
    }
    return lines.join('\n');
  }

  // Helper: CSV stringifier (simple)
  toCSV(columns: string[], rows: any[]) {
    // Escape function
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
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

  // Optional: small HTML generator for PDF (basic)
  toSimpleHtmlReport(title: string, columns: string[], rows: any[]) {
    const ths = columns.map((c) => `<th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">${c}</th>`).join('');
    const trs = rows
      .map(
        (r) =>
          `<tr>${columns
            .map((c) => `<td style="padding:6px;border-bottom:1px solid #eee">${String(r[c] ?? '')}</td>`)
            .join('')}</tr>`
      )
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
}