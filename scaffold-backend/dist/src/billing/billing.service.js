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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invoice_entity_1 = require("../database/entities/invoice.entity");
const invoice_item_entity_1 = require("../database/entities/invoice-item.entity");
const payment_entity_1 = require("../database/entities/payment.entity");
const payment_audit_entity_1 = require("../database/entities/payment-audit.entity");
let BillingService = class BillingService {
    constructor(dataSource, invoiceRepo, invoiceItemRepo, paymentRepo, auditRepo) {
        this.dataSource = dataSource;
        this.invoiceRepo = invoiceRepo;
        this.invoiceItemRepo = invoiceItemRepo;
        this.paymentRepo = paymentRepo;
        this.auditRepo = auditRepo;
    }
    generateInvoiceNumber() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const suffix = String(Date.now()).slice(-6);
        return `INV-${y}${m}${day}-${suffix}`;
    }
    async createAdvancePayment({ builderId, amount, paymentMethod = 'CASH', reference = null, note = null, appliedInvoiceId = null, receivedBy = null }) {
        if (!builderId)
            throw new common_1.BadRequestException('builderId required');
        if (!amount || amount <= 0)
            throw new common_1.BadRequestException('amount must be > 0');
        return this.dataSource.transaction(async (manager) => {
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const payment = paymentRepo.create({
                builderId,
                amount,
                method: paymentMethod,
                reference,
                note,
                receivedBy,
                appliedToInvoiceId: appliedInvoiceId ?? null,
                createdAt: new Date()
            });
            const savedPayment = await paymentRepo.save(payment);
            if (appliedInvoiceId) {
                const invoiceRepo = manager.getRepository(invoice_entity_1.Invoice);
                const invoice = await invoiceRepo.findOne({ where: { id: appliedInvoiceId }, relations: ['items'] });
                if (!invoice)
                    throw new common_1.NotFoundException('Invoice not found to apply payment');
                const paymentsSum = Number(((await paymentRepo.createQueryBuilder('p')
                    .select('SUM(p.amount)', 'sum')
                    .where('p.appliedToInvoiceId = :inv', { inv: invoice.id })
                    .getRawOne())?.sum ?? 0));
                const applied = Number((paymentsSum).toFixed(2));
                invoice.paidAmount = applied;
                const remaining = Number((Number(invoice.total ?? 0) - applied).toFixed(2));
                if (remaining <= 0) {
                    invoice.status = 'PAID';
                }
                else if (applied > 0) {
                    invoice.status = 'PARTIALLY_PAID';
                }
                await invoiceRepo.save(invoice);
            }
            return savedPayment;
        });
    }
    async applyPaymentToInvoice(invoiceId, { amount, paymentMethod = 'CASH', reference = null, receivedBy = null }) {
        if (!invoiceId)
            throw new common_1.BadRequestException('invoiceId required');
        if (!amount || amount <= 0)
            throw new common_1.BadRequestException('amount must be > 0');
        return this.dataSource.transaction(async (manager) => {
            const invoiceRepo = manager.getRepository(invoice_entity_1.Invoice);
            const paymentRepo = manager.getRepository(payment_entity_1.Payment);
            const invoice = await invoiceRepo.findOne({ where: { id: invoiceId } });
            if (!invoice)
                throw new common_1.NotFoundException('Invoice not found');
            const payment = paymentRepo.create({
                builderId: invoice.builderId ?? null,
                amount,
                method: paymentMethod,
                reference,
                appliedToInvoiceId: invoiceId,
                receivedBy,
                createdAt: new Date()
            });
            const savedPayment = await paymentRepo.save(payment);
            const paymentsSum = Number(((await paymentRepo.createQueryBuilder('p')
                .select('SUM(p.amount)', 'sum')
                .where('p.appliedToInvoiceId = :inv', { inv: invoiceId })
                .getRawOne())?.sum ?? 0));
            invoice.paidAmount = paymentsSum;
            const remaining = Number((Number(invoice.total ?? 0) - paymentsSum).toFixed(2));
            if (remaining <= 0) {
                invoice.status = 'PAID';
            }
            else if (paymentsSum > 0) {
                invoice.status = 'PARTIALLY_PAID';
            }
            await invoiceRepo.save(invoice);
            return savedPayment;
        });
    }
    async getCustomerLedger(builderId) {
        if (!builderId)
            throw new common_1.BadRequestException('builderId required');
        const invoices = await this.invoiceRepo.find({ where: { builderId }, order: { issueDate: 'ASC' } });
        const payments = await this.paymentRepo.find({ where: { builderId }, order: { createdAt: 'ASC' } });
        const events = [];
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
        events.sort((a, b) => {
            const da = new Date(a.date).getTime();
            const db = new Date(b.date).getTime();
            if (da === db)
                return a.type === 'INVOICE' ? -1 : 1;
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
        const totalInvoices = invoices.reduce((s, x) => s + Number(x.total ?? 0), 0);
        const totalPayments = payments.reduce((s, x) => s + Number(x.amount ?? 0), 0);
        const balance = Number((totalInvoices - totalPayments).toFixed(2));
        return { builderId, totalInvoices, totalPayments, balance, ledger };
    }
    async ledgerPrintHtml(builderId) {
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
    async ledgerPrintPdf(builderId) {
        const html = await this.ledgerPrintHtml(builderId);
        try {
            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();
            return pdf;
        }
        catch (e) {
            return html;
        }
    }
    async createInvoiceForFee({ builderId = null, orderId = null, description, amount, }) {
        if (!amount || amount <= 0)
            throw new Error('Invalid fee amount');
        let invoice = null;
        if (orderId) {
            const orderRepo = this.dataSource.getRepository('Order');
            const order = await orderRepo.findOne({ where: { id: orderId } });
            if (order && order.invoiceId) {
                invoice = await this.invoiceRepo.findOne({ where: { id: order.invoiceId, status: invoice_entity_1.InvoiceStatus.OPEN } });
            }
        }
        if (!invoice && builderId) {
            invoice = await this.invoiceRepo.findOne({ where: { builderId, status: invoice_entity_1.InvoiceStatus.OPEN } });
        }
        if (!invoice) {
            const invoiceData = {
                builderId: builderId ?? null,
                invoiceNumber: this.generateInvoiceNumber(),
                issueDate: new Date(),
                dueDate: null,
                status: invoice_entity_1.InvoiceStatus.OPEN,
                subtotal: amount,
                tax: 0,
                total: amount,
            };
            const newInvoice = this.invoiceRepo.create(invoiceData);
            const saved = await this.invoiceRepo.save(newInvoice);
            const item = this.invoiceItemRepo.create({
                invoiceId: saved.id,
                productId: null,
                description,
                quantity: 1,
                unitPrice: amount,
                lineTotal: amount,
            });
            await this.invoiceItemRepo.save(item);
            saved.subtotal = Number((saved.subtotal ?? 0).toFixed(2));
            saved.total = Number(((saved.subtotal ?? 0) + (saved.tax ?? 0)).toFixed(2));
            return await this.invoiceRepo.save(saved);
        }
        else {
            const item = this.invoiceItemRepo.create({
                invoiceId: invoice.id,
                productId: null,
                description,
                quantity: 1,
                unitPrice: amount,
                lineTotal: amount,
            });
            await this.invoiceItemRepo.save(item);
            invoice.subtotal = Number(((invoice.subtotal ?? 0) + amount).toFixed(2));
            invoice.total = Number(((invoice.subtotal ?? 0) + (invoice.tax ?? 0)).toFixed(2));
            return await this.invoiceRepo.save(invoice);
        }
    }
    async createInvoiceFromOrder(orderId) {
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository('Order');
            const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
            if (!order)
                throw new Error('Order not found');
            const itemsToSave = [];
            let subtotal = 0;
            for (const oi of order.items) {
                const description = oi.description ?? oi.productName ?? `Product ${oi.productId ?? ''}`;
                const quantity = Number(oi.quantity ?? oi.qty ?? 1);
                const unitPrice = Number(oi.unitPrice ?? oi.price ?? 0);
                const lineTotal = Number((quantity * unitPrice).toFixed(2));
                subtotal += lineTotal;
                itemsToSave.push(manager.create(invoice_item_entity_1.InvoiceItem, {
                    productId: oi.productId ?? null,
                    description,
                    quantity,
                    unitPrice,
                    lineTotal,
                }));
            }
            subtotal = Number(subtotal.toFixed(2));
            const tax = 0;
            const total = Number((subtotal + tax).toFixed(2));
            const invoice = manager.create(invoice_entity_1.Invoice, {
                builderId: order.builderId ?? null,
                invoiceNumber: this.generateInvoiceNumber(),
                issueDate: new Date(),
                dueDate: null,
                status: invoice_entity_1.InvoiceStatus.SENT,
                subtotal,
                tax,
                total,
                items: itemsToSave,
            });
            const savedInvoice = await manager.save(invoice);
            if (order.invoiceId === undefined) {
                order.invoiceId = savedInvoice.id;
                await manager.save(order);
            }
            return savedInvoice;
        });
    }
    async createInvoice(dto) {
        return this.dataSource.transaction(async (manager) => {
            let subtotal = 0;
            const itemsToSave = [];
            for (const it of dto.items) {
                const lineTotal = Number((it.quantity * it.unitPrice).toFixed(2));
                subtotal += lineTotal;
                const item = manager.create(invoice_item_entity_1.InvoiceItem, {
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
            const invoice = manager.create(invoice_entity_1.Invoice, {
                builderId: dto.builderId ?? null,
                invoiceNumber: dto.invoiceNumber ?? `INV-${Date.now()}`,
                issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                status: invoice_entity_1.InvoiceStatus.SENT,
                subtotal,
                tax,
                total,
                items: itemsToSave,
                notes: null,
            });
            return await manager.save(invoice);
        });
    }
    async getInvoice(invoiceId) {
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId }, relations: ['items'] });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const payments = await this.paymentRepo.find({ where: { invoiceId }, order: { createdAt: 'ASC' } });
        const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
        const balance = Number((Number(invoice.total) - paid).toFixed(2));
        return { invoice, payments, paid, balance };
    }
    async createPayment(dto) {
        return this.dataSource.transaction(async (manager) => {
            if (!dto.invoiceId && !dto.builderId)
                throw new common_1.BadRequestException('invoiceId or builderId required');
            const payment = manager.create(payment_entity_1.Payment, {
                invoiceId: dto.invoiceId ?? undefined,
                builderId: dto.builderId ?? undefined,
                amount: dto.amount,
                method: dto.method,
                reference: dto.reference ?? undefined,
                notes: dto.notes ?? undefined,
                status: payment_entity_1.PaymentStatus.COMPLETED,
                recordedBy: dto.recordedBy ?? undefined
            });
            const saved = await manager.save(payment);
            if (dto.invoiceId) {
                const invoice = await manager.findOne(invoice_entity_1.Invoice, { where: { id: dto.invoiceId } });
                if (invoice) {
                    const payments = await manager.find(payment_entity_1.Payment, { where: { invoiceId: invoice.id } });
                    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
                    if (paid >= Number(invoice.total))
                        invoice.status = invoice_entity_1.InvoiceStatus.PAID;
                    else if (paid > 0)
                        invoice.status = invoice_entity_1.InvoiceStatus.PARTIALLY_PAID;
                    await manager.save(invoice);
                }
            }
            return saved;
        });
    }
    async updatePayment(paymentId, dto, changedBy) {
        return this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(payment_entity_1.Payment, { where: { id: paymentId } });
            if (!existing)
                throw new common_1.NotFoundException('Payment not found');
            const old = JSON.stringify(existing);
            Object.assign(existing, dto);
            const saved = await manager.save(existing);
            const audit = manager.create(payment_audit_entity_1.PaymentAudit, {
                paymentId: saved.id,
                oldValue: old,
                newValue: JSON.stringify(saved),
                changedBy: changedBy ?? null
            });
            await manager.save(audit);
            if (saved.invoiceId) {
                const invoice = await manager.findOne(invoice_entity_1.Invoice, { where: { id: saved.invoiceId } });
                if (invoice) {
                    const payments = await manager.find(payment_entity_1.Payment, { where: { invoiceId: invoice.id } });
                    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
                    if (paid >= Number(invoice.total))
                        invoice.status = invoice_entity_1.InvoiceStatus.PAID;
                    else if (paid > 0)
                        invoice.status = invoice_entity_1.InvoiceStatus.PARTIALLY_PAID;
                    else
                        invoice.status = invoice_entity_1.InvoiceStatus.SENT;
                    await manager.save(invoice);
                }
            }
            return saved;
        });
    }
    async paymentsForBuilder(builderId, page = 1, limit = 50) {
        const [items, total] = await this.paymentRepo.findAndCount({
            where: { builderId },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        });
        return { items, total, page, limit };
    }
    async invoicePrintHtml(invoiceId) {
        const { invoice, payments, paid, balance } = await this.getInvoice(invoiceId);
        const itemsHtml = invoice.items
            ?.map((it) => `<tr>
            <td>${it.description}</td>
            <td style="text-align:right">${it.quantity}</td>
            <td style="text-align:right">${Number(it.unitPrice).toFixed(2)}</td>
            <td style="text-align:right">${Number(it.lineTotal).toFixed(2)}</td>
          </tr>`)
            .join('\n') ?? '';
        const paymentsHtml = payments
            .map((p) => `<tr><td>${p.method}</td><td>${p.reference ?? ''}</td><td style="text-align:right">${Number(p.amount).toFixed(2)}</td><td>${p.createdAt.toISOString().slice(0, 19).replace('T', ' ')}</td></tr>`)
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
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(2, (0, typeorm_1.InjectRepository)(invoice_item_entity_1.InvoiceItem)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_audit_entity_1.PaymentAudit)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map