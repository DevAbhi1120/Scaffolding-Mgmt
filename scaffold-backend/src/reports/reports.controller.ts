import { Controller, Get, Query, Res, Param,UseGuards, } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';



@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  // Orders report
  @Get('orders')
  async orders(@Query() query: any, @Res() res: Response) {
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

  // Inventory report
  @Get('inventory')
  async inventory(@Query() query: any, @Res() res: Response) {
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

  // Customers / builders
  @Get('customers')
  async customers(@Query() query: any, @Res() res: Response) {
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

  // Ledger for a builder
  @Get('ledger/:builderId')
  async ledger(@Param('builderId') builderId: string, @Query() query: any, @Res() res: Response) {
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

  // Optional: generate PDF for a report (server-side using Puppeteer if installed)
  // Example endpoint: /reports/orders/pdf?...
  @Get('orders/pdf')
  async ordersPdf(@Query() query: any, @Res() res: Response) {
    const result = await this.svc.ordersReport(query);
    const columns = ['orderId', 'status', 'startDate', 'closeDate', 'createdAt', 'businessName', 'businessAddress', 'itemCount'];
    const html = this.svc.toSimpleHtmlReport('Orders Report', columns, result.items);

    // If puppeteer is installed, generate PDF; otherwise return HTML
    try {
      // dynamic require to avoid crash if puppeteer not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orders_report_${Date.now()}.pdf"`);
      return res.send(pdfBuffer);
    } catch (e) {
      // Puppeteer not installed — return HTML fallback
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
  }

}
