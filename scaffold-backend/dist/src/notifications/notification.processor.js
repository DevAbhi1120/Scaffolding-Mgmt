"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("bullmq");
const notification_entity_1 = require("./notification.entity");
const notification_entity_2 = require("./notification.entity");
const common_1 = require("@nestjs/common");
class NotificationProcessor {
    constructor(dataSource, cfg, notificationsService) {
        this.dataSource = dataSource;
        this.cfg = cfg;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationProcessor.name);
        const connection = {
            host: process.env.REDIS_HOST || this.cfg.get('REDIS_HOST') || '127.0.0.1',
            port: Number(process.env.REDIS_PORT || this.cfg.get('REDIS_PORT') || 6379)
        };
        this.worker = new bullmq_1.Worker('notifications', async (job) => {
            const { notificationId } = job.data;
            this.logger.log(`Processing notification job ${job.id} for notifId=${notificationId}`);
            const notifRepo = this.dataSource.getRepository(notification_entity_1.Notification);
            const notif = await notifRepo.findOne({ where: { id: notificationId } });
            if (!notif) {
                this.logger.warn(`Notification not found: ${notificationId}`);
                return;
            }
            let payloadObj = {};
            if (notif.payload) {
                try {
                    payloadObj = JSON.parse(notif.payload);
                }
                catch (e) {
                    this.logger.warn(`Failed to parse payload for notification ${notificationId}: ${e?.message ?? e}`);
                    payloadObj = {};
                }
            }
            const closeDateStr = (payloadObj && payloadObj.closeDate) ? String(payloadObj.closeDate) : 'unknown date';
            let email = notif.recipientEmail ?? undefined;
            let phone = notif.recipientPhone ?? undefined;
            if (!email && !phone) {
                await notifRepo.update(notificationId, { status: notification_entity_2.NotificationStatus.FAILED, resultMessage: 'No recipient configured' });
                this.logger.warn(`Notification ${notificationId} has no recipient configured`);
                return;
            }
            try {
                if ((notif.type === notification_entity_2.NotificationType.EMAIL || notif.type === notification_entity_2.NotificationType.BOTH) && email) {
                    const subject = `Upcoming order close date for ${notif.entityId}`;
                    const text = `Order ${notif.entityId} is scheduled to close on ${closeDateStr}`;
                    await this.notificationsService.sendEmail(email, subject, text);
                }
                if ((notif.type === notification_entity_2.NotificationType.SMS || notif.type === notification_entity_2.NotificationType.BOTH) && phone) {
                    const body = `Order ${notif.entityId} closes on ${closeDateStr}`;
                    await this.notificationsService.sendSms(phone, body);
                }
                await notifRepo.update(notificationId, { status: notification_entity_2.NotificationStatus.SENT, resultMessage: 'Sent successfully' });
                this.logger.log(`Notification ${notificationId} sent`);
            }
            catch (err) {
                const msg = err?.message ?? String(err);
                await notifRepo.update(notificationId, { status: notification_entity_2.NotificationStatus.FAILED, resultMessage: msg });
                this.logger.error(`Failed sending notification ${notificationId}: ${msg}`);
                throw err;
            }
        }, { connection });
    }
}
exports.NotificationProcessor = NotificationProcessor;
//# sourceMappingURL=notification.processor.js.map