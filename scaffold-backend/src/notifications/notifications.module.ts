import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from '../files/files.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ConfigModule

  ],
  providers: [NotificationsService, NotificationProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
