import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private savingsGoalsService: SavingsGoalsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateGoalDto) {
    return this.savingsGoalsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.savingsGoalsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.savingsGoalsService.findOne(user.userId, id);
  }

  @Post(':id/contributions')
  addContribution(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: AddContributionDto,
  ) {
    return this.savingsGoalsService.addContribution(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.savingsGoalsService.remove(user.userId, id);
  }
}
