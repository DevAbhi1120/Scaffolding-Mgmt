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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const notification_entity_1 = require("./notification.entity");
const typeorm_2 = require("typeorm");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");
const config_1 = require("@nestjs/config");
const typeorm_3 = require("typeorm");
const order_entity_1 = require("../database/entities/order.entity");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(cfg, notificationRepo, dataSource) {
        this.cfg = cfg;
        this.notificationRepo = notificationRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        const smtpHost = process.env.SMTP_HOST || this.cfg.get('SMTP_HOST');
        if (smtpHost) {
            this.smtpTransporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(process.env.SMTP_PORT || this.cfg.get('SMTP_PORT') || 587),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER || this.cfg.get('SMTP_USER'),
                    pass: process.env.SMTP_PASS || this.cfg.get('SMTP_PASS')
                }
            });
        }
        const twSid = process.env.TWILIO_SID || this.cfg.get('TWILIO_SID');
        const twToken = process.env.TWILIO_TOKEN || this.cfg.get('TWILIO_TOKEN');
        if (twSid && twToken) {
            this.twilioClient = Twilio(twSid, twToken);
        }
        const { Queue: BQ } = require('bullmq');
        this.queue = new BQ('notifications', {
            connection: {
                host: process.env.REDIS_HOST || this.cfg.get('REDIS_HOST'),
                port: Number(process.env.REDIS_PORT || this.cfg.get('REDIS_PORT') || 6379)
            }
        });
        this.leadDays = Number(process.env.NOTIFICATION_LEAD_DAYS || this.cfg.get('NOTIFICATION_LEAD_DAYS') || 14);
    }
    async findDueOrdersAndEnqueue() {
        const today = new Date();
        const target = new Date(today);
        target.setDate(today.getDate() + this.leadDays);
        const targetDateStr = target.toISOString().slice(0, 10);
        const orders = await this.dataSource.getRepository(order_entity_1.Order).createQueryBuilder('o')
            .where('DATE(o.closeDate) = :target', { target: targetDateStr })
            .getMany();
        this.logger.log(`Found ${orders.length} orders with closeDate in ${this.leadDays} days (${targetDateStr})`);
        for (const order of orders) {
            let recipientEmail = null;
            let recipientPhone = null;
            if (order.builderId) {
                try {
                    const builder = await this.dataSource.getRepository('builders').findOne({ where: { id: order.builderId } });
                    if (builder) {
                        recipientEmail = builder.contactEmail ?? builder.email ?? null;
                        recipientPhone = builder.contactPhone ?? builder.phone ?? null;
                        if (builder.config && builder.config.notificationEmail) {
                            recipientEmail = builder.config.notificationEmail;
                        }
                        if (builder.config && builder.config.notificationPhone) {
                            recipientPhone = builder.config.notificationPhone;
                        }
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to load builder ${order.builderId} for order ${order.id}: ${e?.message ?? e}`);
                }
            }
            const exists = await this.notificationRepo.findOne({ where: { entityType: 'order', entityId: order.id } });
            if (exists) {
                this.logger.log(`Notification already exists for order ${order.id}, skipping`);
                continue;
            }
            const notif = this.notificationRepo.create({
                entityType: 'order',
                entityId: order.id,
                type: notification_entity_1.NotificationType.BOTH,
                recipientEmail: recipientEmail ?? null,
                recipientPhone: recipientPhone ?? null,
                status: notification_entity_1.NotificationStatus.PENDING,
                payload: JSON.stringify({ orderId: order.id, closeDate: order.closeDate })
            });
            const saved = await this.notificationRepo.save(notif);
            await this.queue.add('send-notification', { notificationId: saved.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
            this.logger.log(`Enqueued notification job for order ${order.id} (notifId=${saved.id})`);
        }
    }
    async markAsSent(id, resultMessage) {
        await this.notificationRepo.update(id, { status: notification_entity_1.NotificationStatus.SENT, resultMessage });
    }
    async markAsFailed(id, resultMessage) {
        await this.notificationRepo.update(id, { status: notification_entity_1.NotificationStatus.FAILED, resultMessage });
    }
    async sendEmail(to, subject, text, html) {
        if (!this.smtpTransporter)
            throw new Error('SMTP not configured');
        return this.smtpTransporter.sendMail({ from: process.env.SMTP_USER || 'no-reply@example.com', to, subject, text, html });
    }
    async sendSms(to, body) {
        if (!this.twilioClient)
            throw new Error('Twilio not configured');
        const from = process.env.TWILIO_PHONE || this.cfg.get('TWILIO_PHONE');
        return this.twilioClient.messages.create({ to, from, body });
    }
    async enqueueNotificationForOrder(orderId) {
        const orderRepo = this.dataSource.getRepository(order_entity_1.Order);
        const order = await orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            throw new Error('Order not found');
        let recipientEmail;
        let recipientPhone;
        if (order.builderId) {
            try {
                const builderRepo = this.dataSource.getRepository('builders');
                const builder = await builderRepo.findOne({ where: { id: order.builderId } });
                if (builder) {
                    recipientEmail = builder.contactEmail ?? builder.email ?? undefined;
                    recipientPhone = builder.contactPhone ?? builder.phone ?? undefined;
                    if (builder.config?.notificationEmail)
                        recipientEmail = builder.config.notificationEmail;
                    if (builder.config?.notificationPhone)
                        recipientPhone = builder.config.notificationPhone;
                }
            }
            catch (e) {
                this.logger.warn(`Failed to load builder ${order.builderId} for order ${order.id}: ${e?.message ?? e}`);
            }
        }
        const exists = await this.notificationRepo.findOne({ where: { entityType: 'order', entityId: order.id } });
        if (exists) {
            this.logger.log(`Notification already exists for order ${order.id}, skipping`);
            return { ok: false, reason: 'duplicate' };
        }
        const notif = this.notificationRepo.create({
            entityType: 'order',
            entityId: order.id,
            type: notification_entity_1.NotificationType.BOTH,
            recipientEmail,
            recipientPhone,
            status: notification_entity_1.NotificationStatus.PENDING,
            payload: JSON.stringify({ orderId: order.id, closeDate: order.closeDate })
        });
        const saved = await this.notificationRepo.save(notif);
        await this.queue.add('send-notification', { notificationId: saved.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
        this.logger.log(`Enqueued notification job for order ${order.id} (notifId=${saved.id})`);
        return { ok: true, notificationId: saved.id, recipients: { email: recipientEmail, phone: recipientPhone } };
    }
    async enqueueEmailNotification(recipientEmail, subject, text, entityType, entityId) {
        const notif = this.notificationRepo.create({
            entityType: entityType || 'general',
            entityId: entityId ?? undefined,
            type: notification_entity_1.NotificationType.EMAIL,
            recipientEmail,
            recipientPhone: undefined,
            status: notification_entity_1.NotificationStatus.PENDING,
            payload: JSON.stringify({ subject, text })
        });
        const saved = await this.notificationRepo.save(notif);
        await this.queue.add('send-notification', { notificationId: saved.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
        return saved;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], NotificationsService);
//# sourceMappingURL=notification.service.js.map