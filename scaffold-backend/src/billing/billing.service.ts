import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';
import { InvoiceItem } from '../database/entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Payment, PaymentMethod, PaymentStatus } from '../database/entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentAudit } from '../database/entities/payment-audit.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class BillingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentAudit) private auditRepo: Repository<PaymentAudit>,
  ) { }

  private generateInvoiceNumber(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const suffix = String(Date.now()).slice(-6);
    return `INV-${y}${m}${day}-${suffix}`;
  }



  /* -----------------------------
   Advance payment: record and optionally auto-allocate
   ----------------------------- */
  async createAdvancePayment({
    builderId,
    amount,
    paymentMethod = 'CASH',
    reference = null,
    note = null,
    appliedInvoiceId = null,
    receivedBy = null
  }: {
    builderId: string;
    amount: number;
    paymentMethod?: string;
    reference?: string | null;
    note?: string | null;
    appliedInvoiceId?: string | null;
    receivedBy?: string | null;
  }) {
    if (!builderId) throw new BadRequestException('builderId required');
    if (!amount || amount <= 0) throw new BadRequestException('amount must be > 0');

    return this.dataSource.transaction(async (manager) => {
      // Create Payment record
      const paymentRepo = manager.getRepository(Payment);
      const payment = paymentRepo.create({
        builderId,
        amount,
        method: paymentMethod,
        reference,
        note,
        receivedBy,
        appliedToInvoiceId: appliedInvoiceId ?? null,
        createdAt: new Date()
      } as any);

      const savedPayment = await paymentRepo.save(payment);

      // If appliedInvoiceId provided, mark the invoice as partially/fully paid
      if (appliedInvoiceId) {
        const invoiceRepo = manager.getRepository(Invoice);
        const invoice = await invoiceRepo.findOne({ where: { id: appliedInvoiceId }, relations: ['items'] as any });
        if (!invoice) throw new NotFoundException('Invoice not found to apply payment');

        // Create payment audit record or update invoice balance fields
        // We'll record payment via Payment table and leave invoice.status to be updated after applying totals
        // Recompute invoice payments total and adjust status:
        const paymentsSum = Number(((await paymentRepo.createQueryBuilder('p')
          .select('SUM(p.amount)', 'sum')
          .where('p.appliedToInvoiceId = :inv', { inv: invoice.id })
          .getRawOne())?.sum ?? 0));

        const applied = Number((paymentsSum).toFixed(2));
        // update invoice paid/balance fields if you have them
        (invoice as any).paidAmount = applied; // optional
        const remaining = Number((Number(invoice.total ?? 0) - applied).toFixed(2));
        if (remaining <= 0) {
          (invoice as any).status = 'PAID';
        } else if (applied > 0) {
          (invoice as any).status = 'PARTIALLY_PAID';
        }
        await invoiceRepo.save(invoice);
      }

      return savedPayment;
    });
  }

  /* -----------------------------
     Apply a payment to an existing invoice
     ----------------------------- */
  async applyPaymentToInvoice(invoiceId: string, { amount, paymentMethod = 'CASH', reference = null, receivedBy = null }: { amount: number; paymentMethod?: string; reference?: string | null; receivedBy?: string | null; }) {
    if (!invoiceId) throw new BadRequestException('invoiceId required');
    if (!amount || amount <= 0) throw new BadRequestException('amount must be > 0');

    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const paymentRepo = manager.getRepository(Payment);

      const invoice = await invoiceRepo.findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const payment = paymentRepo.create({
        builderId: invoice.builderId ?? null,
        amount,
        method: paymentMethod,
        reference,
        appliedToInvoiceId: invoiceId,
        receivedBy,
        createdAt: new Date()
      } as any);

      const savedPayment = await paymentRepo.save(payment);

      // Recompute totals and update invoice status
      const paymentsSum = Number(((await paymentRepo.createQueryBuilder('p')
        .select('SUM(p.amount)', 'sum')
        .where('p.appliedToInvoiceId = :inv', { inv: invoiceId })
        .getRawOne())?.sum ?? 0));

      (invoice as any).paidAmount = paymentsSum;
      const remaining = Number((Number(invoice.total ?? 0) - paymentsSum).toFixed(2));
      if (remaining <= 0) {
        (invoice as any).status = 'PAID';
      } else if (paymentsSum > 0) {
        (invoice as any).status = 'PARTIALLY_PAID';
      }

      await invoiceRepo.save(invoice);
      return savedPayment;
    });
  }

  /* -----------------------------
     Customer Ledger: invoices + payments + running balance
     ----------------------------- */
  async getCustomerLedger(builderId: string) {
    if (!builderId) throw new BadRequestException('builderId required');

    // fetch invoices and payments ordered by date
    const invoices = await this.invoiceRepo.find({ where: { builderId }, order: { issueDate: 'ASC' } as any });
    const payments = await this.paymentRepo.find({ where: { builderId }, order: { createdAt: 'ASC' } as any });

    // Merge into timeline and compute running balance
    const events: Array<any> = [];

    for (const inv of invoices) {
      events.push({
        type: 'INVOICE',
        id: inv.id,
        date: inv.issueDate ?? inv.createdAt,
        amount: Number(inv.total ?? 0),
        description: `Invoice ${inv.invoiceNumber ?? inv.id}`,
        raw: inv
      });
    }

    for (const pay of payments) {
      events.push({
        type: 'PAYMENT',
        id: pay.id,
        date: pay.createdAt,
        amount: -Number(pay.amount ?? 0),
        description: `Payment (${pay.method ?? 'UNKNOWN'}) ${pay.reference ?? ''}`,
        raw: pay
      });
    }

    // sort by date ascending (tie-break: INVOICE before PAYMENT)
    events.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da === db) return a.type === 'INVOICE' ? -1 : 1;
      return da - db;
    });

    let running = 0;
    const ledger = events.map((e) => {
      running = Number((running + Number(e.amount)).toFixed(2));
      return {
        ...e,
        runningBalance: running
      };
    });

    // totals
    const totalInvoices = invoices.reduce((s, x) => s + Number(x.total ?? 0), 0);
    const totalPayments = payments.reduce((s, x) => s + Number(x.amount ?? 0), 0);
    const balance = Number((totalInvoices - totalPayments).toFixed(2));

    return { builderId, totalInvoices, totalPayments, balance, ledger };
  }

  /* -----------------------------
     Customer Ledger HTML + PDF
     ----------------------------- */
  async ledgerPrintHtml(builderId: string) {
    // Build a minimal ledger HTML, you can style this template as you like
    const { totalInvoices, totalPayments, balance, ledger } = await this.getCustomerLedger(builderId);

    const rowsHtml = ledger.map((r) => {
      const date = new Date(r.date).toLocaleString();
      const amount = Number(r.amount).toFixed(2);
      const balanceStr = Number(r.runningBalance).toFixed(2);
      const desc = r.description ?? '';
      return `<tr>
      <td style="padding:8px;border:1px solid #ddd">${date}</td>
      <td style="padding:8px;border:1px solid #ddd">${desc}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${amount}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${balanceStr}</td>
    </tr>`;
    }).join('\n');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Customer Ledger</title>
  <style>body{font-family:Arial,Helvetica,sans-serif}table{border-collapse:collapse;width:100%}th,td{padding:8px;text-align:left;border:1px solid #ddd}</style>
  </head><body>
  <h2>Customer Ledger - ${builderId}</h2>
  <p>Total Invoices: ${totalInvoices.toFixed(2)} &nbsp; | &nbsp; Total Payments: ${totalPayments.toFixed(2)} &nbsp; | &nbsp; Balance: ${balance.toFixed(2)}</p>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:right">Running Balance</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  </body></html>`;

    return html;
  }

  async ledgerPrintPdf(builderId: string) {
    const html = await this.ledgerPrintHtml(builderId);
    // generate PDF using puppeteer
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      return pdf; // Buffer
    } catch (e) {
      // If puppeteer not available, return HTML string instead
      return html;
    }
  }



  /**
   * Create an invoice for a fee or append to existing invoice
   */
  async createInvoiceForFee({
    builderId = null,
    orderId = null,
    description,
    amount,
  }: {
    builderId?: string | null;
    orderId?: string | null;
    description: string;
    amount: number;
  }): Promise<Invoice> {
    if (!amount || amount <= 0) throw new Error('Invalid fee amount');

    // Find open invoice
    let invoice: Invoice | null = null;
    if (orderId) {
      const orderRepo = this.dataSource.getRepository('Order');
      const order: any = await orderRepo.findOne({ where: { id: orderId } });
      if (order && order.invoiceId) {
        invoice = await this.invoiceRepo.findOne({ where: { id: order.invoiceId, status: InvoiceStatus.OPEN } });
      }
    }
    if (!invoice && builderId) {
      invoice = await this.invoiceRepo.findOne({ where: { builderId, status: InvoiceStatus.OPEN } });
    }

    if (!invoice) {
      // Create new invoice
      const invoiceData: Partial<Invoice> = {
        builderId: builderId ?? null,
        invoiceNumber: this.generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: null,
        status: InvoiceStatus.OPEN,
        subtotal: amount,
        tax: 0,
        total: amount,
      };

      const newInvoice: Invoice = this.invoiceRepo.create(invoiceData);
      const saved: Invoice = await this.invoiceRepo.save(newInvoice);

      // Create invoice item
      const item: InvoiceItem = this.invoiceItemRepo.create({
        invoiceId: saved.id,
        productId: null,
        description,
        quantity: 1,
        unitPrice: amount,
        lineTotal: amount,
      });
      await this.invoiceItemRepo.save(item);

      // Recalculate totals
      saved.subtotal = Number((saved.subtotal ?? 0).toFixed(2));
      saved.total = Number(((saved.subtotal ?? 0) + (saved.tax ?? 0)).toFixed(2));
      return await this.invoiceRepo.save(saved);
    } else {
      // Append fee item
      const item: InvoiceItem = this.invoiceItemRepo.create({
        invoiceId: invoice.id,
        productId: null,
        description,
        quantity: 1,
        unitPrice: amount,
        lineTotal: amount,
      });
      await this.invoiceItemRepo.save(item);

      // Update totals
      invoice.subtotal = Number(((invoice.subtotal ?? 0) + amount).toFixed(2));
      invoice.total = Number(((invoice.subtotal ?? 0) + (invoice.tax ?? 0)).toFixed(2));

      return await this.invoiceRepo.save(invoice);
    }
  }

  /**
   * Create invoice from order
   */
  async createInvoiceFromOrder(orderId: string): Promise<Invoice> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository('Order' as any);
      const order: any = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
      if (!order) throw new Error('Order not found');

      const itemsToSave: InvoiceItem[] = [];
      let subtotal = 0;

      for (const oi of order.items) {
        const description = oi.description ?? oi.productName ?? `Product ${oi.productId ?? ''}`;
        const quantity = Number(oi.quantity ?? oi.qty ?? 1);
        const unitPrice = Number(oi.unitPrice ?? oi.price ?? 0);
        const lineTotal = Number((quantity * unitPrice).toFixed(2));
        subtotal += lineTotal;

        itemsToSave.push(
          manager.create(InvoiceItem, {
            productId: oi.productId ?? null,
            description,
            quantity,
            unitPrice,
            lineTotal,
          })
        );
      }

      subtotal = Number(subtotal.toFixed(2));
      const tax = 0;
      const total = Number((subtotal + tax).toFixed(2));

      const invoice = manager.create(Invoice, {
        builderId: order.builderId ?? null,
        invoiceNumber: this.generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: null,
        status: InvoiceStatus.SENT,
        subtotal,
        tax,
        total,
        items: itemsToSave,
      });

      const savedInvoice: Invoice = await manager.save(invoice);

      if (order.invoiceId === undefined) {
        order.invoiceId = savedInvoice.id;
        await manager.save(order);
      }

      return savedInvoice;
    });
  }

  /**
   * Create invoice (transactional)
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return this.dataSource.transaction(async (manager) => {
      let subtotal = 0;
      const itemsToSave: InvoiceItem[] = [];

      for (const it of dto.items) {
        const lineTotal = Number((it.quantity * it.unitPrice).toFixed(2));
        subtotal += lineTotal;
        const item = manager.create(InvoiceItem, {
          productId: it.productId ?? null,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal,
        });
        itemsToSave.push(item);
      }

      subtotal = Number(subtotal.toFixed(2));
      const tax = 0;
      const total = Number((subtotal + tax).toFixed(2));

      const invoice = manager.create(Invoice, {
        builderId: dto.builderId ?? null,
        invoiceNumber: dto.invoiceNumber ?? `INV-${Date.now()}`,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: InvoiceStatus.SENT,
        subtotal,
        tax,
        total,
        items: itemsToSave,
        notes: null,
      });

      return await manager.save(invoice);
    });
  }

  // Get invoice with payments and balance
  async getInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId }, relations: ['items'] });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const payments = await this.paymentRepo.find({ where: { invoiceId }, order: { createdAt: 'ASC' } });
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number((Number(invoice.total) - paid).toFixed(2));
    return { invoice, payments, paid, balance };
  }

  // Create payment and update invoice status (transactional)
  async createPayment(dto: CreatePaymentDto) {
    return this.dataSource.transaction(async (manager) => {
      if (!dto.invoiceId && !dto.builderId)
        throw new BadRequestException('invoiceId or builderId required');

      const payment = manager.create(Payment, {
        invoiceId: dto.invoiceId ?? undefined,
        builderId: dto.builderId ?? undefined,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference ?? undefined,
        notes: dto.notes ?? undefined,
        status: PaymentStatus.COMPLETED,
        recordedBy: dto.recordedBy ?? undefined
      });

      const saved = await manager.save(payment);

      if (dto.invoiceId) {
        const invoice = await manager.findOne(Invoice, { where: { id: dto.invoiceId } });
        if (invoice) {
          const payments = await manager.find(Payment, { where: { invoiceId: invoice.id } });
          const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
          if (paid >= Number(invoice.total)) invoice.status = InvoiceStatus.PAID;
          else if (paid > 0) invoice.status = InvoiceStatus.PARTIALLY_PAID;
          await manager.save(invoice);
        }
      }

      return saved;
    });
  }

  // Edit payment (audit trail)
  async updatePayment(paymentId: string, dto: Partial<CreatePaymentDto>, changedBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Payment, { where: { id: paymentId } });
      if (!existing) throw new NotFoundException('Payment not found');

      const old = JSON.stringify(existing);
      Object.assign(existing, dto);
      const saved = await manager.save(existing);

      const audit = manager.create(PaymentAudit, {
        paymentId: saved.id,
        oldValue: old,
        newValue: JSON.stringify(saved),
        changedBy: changedBy ?? null
      });
      await manager.save(audit);

      if (saved.invoiceId) {
        const invoice = await manager.findOne(Invoice, { where: { id: saved.invoiceId } });
        if (invoice) {
          const payments = await manager.find(Payment, { where: { invoiceId: invoice.id } });
          const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
          if (paid >= Number(invoice.total)) invoice.status = InvoiceStatus.PAID;
          else if (paid > 0) invoice.status = InvoiceStatus.PARTIALLY_PAID;
          else invoice.status = InvoiceStatus.SENT;
          await manager.save(invoice);
        }
      }

      return saved;
    });
  }

  // List payments for a builder
  async paymentsForBuilder(builderId: string, page = 1, limit = 50) {
    const [items, total] = await this.paymentRepo.findAndCount({
      where: { builderId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });
    return { items, total, page, limit };
  }

  // Print invoice HTML
  async invoicePrintHtml(invoiceId: string) {
    const { invoice, payments, paid, balance } = await this.getInvoice(invoiceId);

    const itemsHtml = invoice.items
      ?.map(
        (it) =>
          `<tr>
            <td>${it.description}</td>
            <td style="text-align:right">${it.quantity}</td>
            <td style="text-align:right">${Number(it.unitPrice).toFixed(2)}</td>
            <td style="text-align:right">${Number(it.lineTotal).toFixed(2)}</td>
          </tr>`
      )
      .join('\n') ?? '';

    const paymentsHtml = payments
      .map(
        (p) =>
          `<tr><td>${p.method}</td><td>${p.reference ?? ''}</td><td style="text-align:right">${Number(
            p.amount
          ).toFixed(2)}</td><td>${p.createdAt.toISOString().slice(0, 19).replace('T', ' ')}</td></tr>`
      )
      .join('\n');

    const html = `
      <html>
        <head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title></head>
        <body style="font-family:Arial, Helvetica, sans-serif; font-size:12px; padding:20px;">
          <h2>Invoice: ${invoice.invoiceNumber ?? invoice.id}</h2>
          <div>Issue Date: ${invoice.issueDate ? invoice.issueDate.toISOString().slice(0, 10) : ''}</div>
          <div>Due Date: ${invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : ''}</div>
          <h3>Items</h3>
          <table style="width:100%; border-collapse:collapse">
            <thead>
              <tr><th style="text-align:left">Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Line</th></tr>
            </thead>
            <tbody>
            ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top:10px;text-align:right">
            <div>Subtotal: ${Number(invoice.subtotal).toFixed(2)}</div>
            <div>Tax: ${Number(invoice.tax).toFixed(2)}</div>
            <div><strong>Total: ${Number(invoice.total).toFixed(2)}</strong></div>
            <div>Paid: ${Number(paid).toFixed(2)}</div>
            <div><strong>Balance: ${Number(balance).toFixed(2)}</strong></div>
          </div>

          <h3>Payments</h3>
          <table style="width:100%; border-collapse:collapse">
            <thead><tr><th>Method</th><th>Reference</th><th style="text-align:right">Amount</th><th>Date</th></tr></thead>
            <tbody>${paymentsHtml}</tbody>
          </table>
        </body>
      </html>
    `;
    return html;
  }
}