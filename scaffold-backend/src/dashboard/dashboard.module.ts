import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService]
})
export class DashboardModule {}
