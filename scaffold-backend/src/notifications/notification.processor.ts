// src/notifications/notification.processor.ts
import { Worker, Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationStatus, NotificationType } from './notification.entity';
import { NotificationsService } from './notification.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export class NotificationProcessor {
  private worker: Worker;
  private logger = new Logger(NotificationProcessor.name);

  constructor(
    private dataSource: DataSource,
    private cfg: ConfigService,
    private notificationsService: NotificationsService
  ) {
    const connection = {
      host: process.env.REDIS_HOST || this.cfg.get('REDIS_HOST') || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || this.cfg.get('REDIS_PORT') || 6379)
    };

    // Worker will process 'send-notification' jobs
    this.worker = new Worker(
      'notifications',
      async (job: Job) => {
        const { notificationId } = job.data;
        this.logger.log(`Processing notification job ${job.id} for notifId=${notificationId}`);
        const notifRepo = this.dataSource.getRepository(Notification);
        const notif = await notifRepo.findOne({ where: { id: notificationId } });
        if (!notif) {
          this.logger.warn(`Notification not found: ${notificationId}`);
          return;
        }

        // Safe parse of payload and extraction of closeDate
        let payloadObj: any = {};
        if (notif.payload) {
          try {
            payloadObj = JSON.parse(notif.payload);
          } catch (e) {
            this.logger.warn(`Failed to parse payload for notification ${notificationId}: ${(e as any)?.message ?? e}`);
            payloadObj = {};
          }
        }

        const closeDateStr: string = (payloadObj && payloadObj.closeDate) ? String(payloadObj.closeDate) : 'unknown date';

        // Dummy lookup for recipient(s) — extend to find builder email/phone later
        let email = notif.recipientEmail ?? undefined;
        let phone = notif.recipientPhone ?? undefined;

        // If no recipient stored, attempt to derive from related order builder (left as extension)
        // For now if no recipients, mark failed.
        if (!email && !phone) {
          await notifRepo.update(notificationId, { status: NotificationStatus.FAILED, resultMessage: 'No recipient configured' });
          this.logger.warn(`Notification ${notificationId} has no recipient configured`);
          return;
        }

        try {
          // send email if configured
          if ((notif.type === NotificationType.EMAIL || notif.type === NotificationType.BOTH) && email) {
            const subject = `Upcoming order close date for ${notif.entityId}`;
            const text = `Order ${notif.entityId} is scheduled to close on ${closeDateStr}`;
            await this.notificationsService.sendEmail(email, subject, text);
          }

          // send sms if configured
          if ((notif.type === NotificationType.SMS || notif.type === NotificationType.BOTH) && phone) {
            const body = `Order ${notif.entityId} closes on ${closeDateStr}`;
            await this.notificationsService.sendSms(phone, body);
          }

          await notifRepo.update(notificationId, { status: NotificationStatus.SENT, resultMessage: 'Sent successfully' });
          this.logger.log(`Notification ${notificationId} sent`);
        } catch (err) {
          const msg = (err as any)?.message ?? String(err);
          await notifRepo.update(notificationId, { status: NotificationStatus.FAILED, resultMessage: msg });
          this.logger.error(`Failed sending notification ${notificationId}: ${msg}`);
          throw err; // rethrow to let Bull retry if configured
        }
      },
      { connection }
    );
  }
}
