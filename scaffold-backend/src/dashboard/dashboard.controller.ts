import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get('summary')
  async summary() {
    return this.svc.fullSummary();
  }

  @Get('jobs')
  async jobs(@Query('start') start?: string, @Query('end') end?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.jobsList(start, end, Number(page) || 1, Number(limit) || 50);
  }

  @Get('payments')
  async payments(@Query('start') start?: string, @Query('end') end?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.paymentsReceived(start, end, Number(page) || 1, Number(limit) || 50);
  }
}
