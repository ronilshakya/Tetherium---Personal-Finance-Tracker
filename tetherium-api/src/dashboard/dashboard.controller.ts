import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentUser() user: { userId: string },
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getSummary(user.userId, month, year);
  }

  @Get('spending-by-category')
  getSpendingByCategory(
    @CurrentUser() user: { userId: string },
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getSpendingByCategory(
      user.userId,
      month,
      year,
    );
  }

  @Get('monthly-trend')
  getMonthlyTrend(
    @CurrentUser() user: { userId: string },
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.dashboardService.getMonthlyTrend(user.userId, months);
  }
}
