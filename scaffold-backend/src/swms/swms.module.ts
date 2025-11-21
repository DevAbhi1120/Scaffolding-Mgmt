import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Swms } from '../database/entities/swms.entity';
import { SwmsService } from './swms.service';
import { SwmsController } from './swms.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Swms]), NotificationsModule],
  providers: [SwmsService],
  controllers: [SwmsController],
  exports: [SwmsService]
})
export class SwmsModule {}
