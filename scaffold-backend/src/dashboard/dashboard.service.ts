import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private dataSource: DataSource) {}

  // Total clients (builders)
  async totalClients(): Promise<number> {
    const res = await this.dataSource.query('SELECT COUNT(*) as cnt FROM builders');
    return Number(res?.[0]?.cnt ?? 0);
  }

  // Total users
  async totalUsers(): Promise<number> {
    const res = await this.dataSource.query('SELECT COUNT(*) as cnt FROM users');
    return Number(res?.[0]?.cnt ?? 0);
  }

  // Jobs summary: total jobs, ongoing, closed
  async jobsSummary(): Promise<{ total: number; ongoing: number; closed: number }> {
    const totalRes = await this.dataSource.query('SELECT COUNT(*) as cnt FROM orders');
    const ongoingRes = await this.dataSource.query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'OPEN'");
    const closedRes = await this.dataSource.query("SELECT COUNT(*) as cnt FROM orders WHERE status = 'CLOSED'");
    return {
      total: Number(totalRes?.[0]?.cnt ?? 0),
      ongoing: Number(ongoingRes?.[0]?.cnt ?? 0),
      closed: Number(closedRes?.[0]?.cnt ?? 0)
    };
  }

  // Total payment balance (sum of invoices - payments) simple approach:
  // If you have invoices/payments: compute outstanding = sum(invoices.total) - sum(payments.amount)
  async totalPaymentBalance(): Promise<number> {
    const invRes = await this.dataSource.query('SELECT IFNULL(SUM(total),0) as total FROM invoices');
    const payRes = await this.dataSource.query('SELECT IFNULL(SUM(amount),0) as paid FROM payments');
    const invTotal = Number(invRes?.[0]?.total ?? 0);
    const paid = Number(payRes?.[0]?.paid ?? 0);
    return Number((invTotal - paid).toFixed(2));
  }

  // Jobs generated list for a date range (start and end are ISO strings)
  async jobsList(start?: string, end?: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const params: any[] = [];
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
    // total count for the same filters:
    const countSql = `SELECT COUNT(*) as cnt FROM orders o WHERE ${where}`;
    const countParams = params.slice(0, params.length - 2);
    const totalRes = await this.dataSource.query(countSql, countParams);
    const total = Number(totalRes?.[0]?.cnt ?? 0);
    return { items, total, page, limit };
  }

  // Payments received for a period
  async paymentsReceived(start?: string, end?: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const params: any[] = [];
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
    // total sum in period
    const sumSql = `SELECT IFNULL(SUM(amount),0) as totalReceived FROM payments WHERE ${where}`;
    const sumRes = await this.dataSource.query(sumSql, countParams);
    const totalReceived = Number(sumRes?.[0]?.totalReceived ?? 0);
    return { items, total, page, limit, totalReceived };
  }

  // Combined summary endpoint
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
}
