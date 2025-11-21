import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification, NotificationStatus, NotificationType } from './notification.entity';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as Twilio from 'twilio';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Order } from '../database/entities/order.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private smtpTransporter?: nodemailer.Transporter;
    private twilioClient?: Twilio.Twilio;
    private queue: Queue;
    private leadDays: number;

    constructor(
        private cfg: ConfigService,
        @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
        private dataSource: DataSource
    ) {
        // init transporter if SMTP configured
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

        // init Twilio if configured
        const twSid = process.env.TWILIO_SID || this.cfg.get('TWILIO_SID');
        const twToken = process.env.TWILIO_TOKEN || this.cfg.get('TWILIO_TOKEN');
        if (twSid && twToken) {
            this.twilioClient = Twilio(twSid, twToken);
        }

        // BullMQ queue (direct)
        const { Queue: BQ } = require('bullmq');
        this.queue = new BQ('notifications', {
            connection: {
                host: process.env.REDIS_HOST || this.cfg.get('REDIS_HOST'),
                port: Number(process.env.REDIS_PORT || this.cfg.get('REDIS_PORT') || 6379)
            }
        });

        this.leadDays = Number(process.env.NOTIFICATION_LEAD_DAYS || this.cfg.get('NOTIFICATION_LEAD_DAYS') || 14);
    }

    // Called by scheduler: find orders with closeDate - leadDays == today and create notification jobs
    async findDueOrdersAndEnqueue() {
        const today = new Date();
        const target = new Date(today);
        target.setDate(today.getDate() + this.leadDays);
        const targetDateStr = target.toISOString().slice(0, 10); // yyyy-mm-dd

        // Query orders whose closeDate equals target date
        const orders = await this.dataSource.getRepository(Order).createQueryBuilder('o')
            .where('DATE(o.closeDate) = :target', { target: targetDateStr })
            .getMany();

        this.logger.log(`Found ${orders.length} orders with closeDate in ${this.leadDays} days (${targetDateStr})`);

        for (const order of orders) {
            // if builderId present, try to load builder contact info
            let recipientEmail: string | null = null;
            let recipientPhone: string | null = null;

            if (order.builderId) {
                try {
                    const builder = await this.dataSource.getRepository('builders').findOne({ where: { id: order.builderId } }) as any;
                    if (builder) {
                        recipientEmail = builder.contactEmail ?? builder.email ?? null;
                        recipientPhone = builder.contactPhone ?? builder.phone ?? null;
                        // builder.config may contain override recipients or leadDays
                        if (builder.config && builder.config.notificationEmail) {
                            recipientEmail = builder.config.notificationEmail;
                        }
                        if (builder.config && builder.config.notificationPhone) {
                            recipientPhone = builder.config.notificationPhone;
                        }
                    }
                } catch (e) {
                    this.logger.warn(`Failed to load builder ${order.builderId} for order ${order.id}: ${(e as any)?.message ?? e}`);
                }
            }

            // Avoid duplicate notifications for same order (simple check)
            const exists = await this.notificationRepo.findOne({ where: { entityType: 'order', entityId: order.id } });
            if (exists) {
                this.logger.log(`Notification already exists for order ${order.id}, skipping`);
                continue;
            }

            // Create DB notification record with recipients (may be null)
            const notif = this.notificationRepo.create({
                entityType: 'order',
                entityId: order.id,
                type: NotificationType.BOTH,
                recipientEmail: recipientEmail ?? null,
                recipientPhone: recipientPhone ?? null,
                status: NotificationStatus.PENDING,
                payload: JSON.stringify({ orderId: order.id, closeDate: order.closeDate })
            });
            const saved = await this.notificationRepo.save(notif);

            // Enqueue job with notificationId
            await this.queue.add('send-notification', { notificationId: saved.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
            this.logger.log(`Enqueued notification job for order ${order.id} (notifId=${saved.id})`);
        }
    }

    // Processor will call this to actually send notifications (but we include a helper too)
    async markAsSent(id: string, resultMessage?: string) {
        await this.notificationRepo.update(id, { status: NotificationStatus.SENT, resultMessage });
    }

    async markAsFailed(id: string, resultMessage?: string) {
        await this.notificationRepo.update(id, { status: NotificationStatus.FAILED, resultMessage });
    }

    // Helper to send email (if transporter configured)
    async sendEmail(to: string, subject: string, text: string, html?: string) {
        if (!this.smtpTransporter) throw new Error('SMTP not configured');
        return this.smtpTransporter.sendMail({ from: process.env.SMTP_USER || 'no-reply@example.com', to, subject, text, html });
    }

    // Helper to send SMS via Twilio (if configured)
    async sendSms(to: string, body: string) {
        if (!this.twilioClient) throw new Error('Twilio not configured');
        const from = process.env.TWILIO_PHONE || this.cfg.get('TWILIO_PHONE');
        return this.twilioClient.messages.create({ to, from, body });
    }

    // Creates a notification for a single order (fills recipients from builder if available) and enqueues it.
    async enqueueNotificationForOrder(orderId: string) {
        // Load order
        const orderRepo = this.dataSource.getRepository(Order);
        const order = await orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new Error('Order not found');

        // Derive recipients from builder, if any
        let recipientEmail: string | undefined;
        let recipientPhone: string | undefined;

        if (order.builderId) {
            try {
                const builderRepo = this.dataSource.getRepository('builders');
                const builder = await builderRepo.findOne({ where: { id: order.builderId } }) as any;
                if (builder) {
                    recipientEmail = builder.contactEmail ?? builder.email ?? undefined;
                    recipientPhone = builder.contactPhone ?? builder.phone ?? undefined;

                    // Check builder config overrides
                    if (builder.config?.notificationEmail) recipientEmail = builder.config.notificationEmail;
                    if (builder.config?.notificationPhone) recipientPhone = builder.config.notificationPhone;
                }
            } catch (e) {
                this.logger.warn(`Failed to load builder ${order.builderId} for order ${order.id}: ${(e as any)?.message ?? e}`);
            }
        }

        // Avoid duplicate notifications
        const exists = await this.notificationRepo.findOne({ where: { entityType: 'order', entityId: order.id } });
        if (exists) {
            this.logger.log(`Notification already exists for order ${order.id}, skipping`);
            return { ok: false, reason: 'duplicate' };
        }

        // Create DB notification record
        const notif = this.notificationRepo.create({
            entityType: 'order',
            entityId: order.id,
            type: NotificationType.BOTH,
            recipientEmail,
            recipientPhone,
            status: NotificationStatus.PENDING,
            payload: JSON.stringify({ orderId: order.id, closeDate: order.closeDate })
        });

        // Save single entity and assert type
        const saved = await this.notificationRepo.save(notif) as Notification;

        // Enqueue job
        await this.queue.add(
            'send-notification',
            { notificationId: saved.id },
            { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
        );

        this.logger.log(`Enqueued notification job for order ${order.id} (notifId=${saved.id})`);

        return { ok: true, notificationId: saved.id, recipients: { email: recipientEmail, phone: recipientPhone } };
    }



    async enqueueEmailNotification(
        recipientEmail: string,
        subject: string,
        text: string,
        entityType?: string,
        entityId?: string
    ) {
        // Create notification using undefined instead of null
        const notif = this.notificationRepo.create({
            entityType: entityType || 'general',
            entityId: entityId ?? undefined,
            type: NotificationType.EMAIL,
            recipientEmail,
            recipientPhone: undefined,
            status: NotificationStatus.PENDING,
            payload: JSON.stringify({ subject, text })
        });

        // Save single entity and assert type
        const saved = await this.notificationRepo.save(notif) as Notification;

        // Enqueue job
        await this.queue.add(
            'send-notification',
            { notificationId: saved.id },
            { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
        );

        return saved;
    }


}
