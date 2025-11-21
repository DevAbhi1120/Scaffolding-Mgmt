import { Controller, Post, Body, Get, Param, Query, Put, Res, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('billing')
export class BillingController {
  constructor(private svc: BillingService) { }

  private async sendHtmlOrPdf(res: Response, html: string, filenamePrefix: string, format?: string) {
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
      } catch (e) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
  }

  // -------------------- Invoice Routes --------------------
  @Post('invoices')
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.svc.createInvoice(dto);
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') id: string) {
    return this.svc.getInvoice(id);
  }

  @Get('invoices/:id/print')
  async printInvoice(@Param('id') id: string, @Query('format') format: string, @Res() res: Response) {
    const html = await this.svc.invoicePrintHtml(id);
    return this.sendHtmlOrPdf(res, html, `invoice_${id}`, format);
  }

  // New: Voucher generation
  @Post('invoices/:id/voucher')
  @UseGuards(JwtAuthGuard)
  async invoiceVoucher(@Param('id') id: string, @Query('format') format: string, @Res() res: Response) {
    const html = await this.svc.invoicePrintHtml(id);
    return this.sendHtmlOrPdf(res, html, `voucher_${id}`, format);
  }

  // New: Receipt generation
  @Post('invoices/:id/receipt')
  @UseGuards(JwtAuthGuard)
  async invoiceReceipt(@Param('id') id: string, @Query('format') format: string, @Res() res: Response) {
    const html = await this.svc.invoicePrintHtml(id);
    return this.sendHtmlOrPdf(res, html, `receipt_${id}`, format);
  }

  // -------------------- Payment Routes --------------------
  @Post('payments')
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.svc.createPayment(dto);
  }

  @Put('payments/:id')
  async updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.svc.updatePayment(id, dto);
  }

  @Get('payments/builder/:builderId')
  async paymentsForBuilder(
    @Param('builderId') builderId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.svc.paymentsForBuilder(builderId, Number(page) || 1, Number(limit) || 50);
  }

  // POST /billing/payments/advance
  @Post('payments/advance')
  @UseGuards(JwtAuthGuard)
  async createAdvancePayment(@Body() body: any) {
    // body: { builderId, amount, paymentMethod, reference, note, appliedInvoiceId }
    return this.svc.createAdvancePayment(body);
  }

  // POST /billing/invoices/:id/apply-payment
  @Post('invoices/:id/apply-payment')
  @UseGuards(JwtAuthGuard)
  async applyPayment(@Param('id') invoiceId: string, @Body() body: { amount: number; paymentMethod?: string; reference?: string; receivedBy?: string; }) {
    return this.svc.applyPaymentToInvoice(invoiceId, body);
  }

  // GET /billing/ledger/:builderId
  @Get('ledger/:builderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLedger(@Param('builderId') builderId: string) {
    return this.svc.getCustomerLedger(builderId);
  }

  // GET /billing/ledger/:builderId/pdf
  @Get('ledger/:builderId/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLedgerPdf(@Param('builderId') builderId: string, @Res() res: Response, @Query('format') format?: string) {
    const out = await this.svc.ledgerPrintPdf(builderId);
    if (Buffer.isBuffer(out)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ledger_${builderId}.pdf"`);
      return res.send(out);
    } else {
      // returned HTML fallback
      res.setHeader('Content-Type', 'text/html');
      return res.send(out);
    }
  }
}
