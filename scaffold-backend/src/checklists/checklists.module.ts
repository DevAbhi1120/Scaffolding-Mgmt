import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyChecklist } from '@src/database/entities/safety-checklist.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from '@src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyChecklist]), FilesModule,NotificationsModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
