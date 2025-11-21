import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyChecklist } from './safety_checklist.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyChecklist]), NotificationsModule],
  providers: [ChecklistsService],
  controllers: [ChecklistsController],
  exports: [ChecklistsService]
})
export class ChecklistsModule {}
