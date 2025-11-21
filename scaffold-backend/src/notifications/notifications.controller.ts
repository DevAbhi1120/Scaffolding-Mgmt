// src/notifications/notifications.controller.ts
import { Controller, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  /**
   * POST /notifications/enqueue/:orderId
   * Manually create + enqueue a notification for a single order.
   */
  @Post('enqueue/:orderId')
  async enqueueForOrder(@Param('orderId') orderId: string) {
    try {
      const result = await this.svc.enqueueNotificationForOrder(orderId);
      return result;
    } catch (err) {
      throw new HttpException((err as any)?.message ?? String(err), HttpStatus.BAD_REQUEST);
    }
  }
}
