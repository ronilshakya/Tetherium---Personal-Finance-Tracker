import { Module } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { SavingsGoalsController } from './savings-goals.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SavingsGoalsService],
  controllers: [SavingsGoalsController],
})
export class SavingsGoalsModule {}
