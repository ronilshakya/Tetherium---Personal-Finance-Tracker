import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateGoalDto) {
    return this.prisma.savingsGoal.create({
      data: {
        ...dto,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({
      where: { id },
      include: { contributions: { orderBy: { date: 'desc' } } },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    return goal;
  }

  async addContribution(
    userId: string,
    goalId: string,
    dto: AddContributionDto,
  ) {
    const goal = await this.prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();

    // Run both writes atomically — either both succeed or neither does
    const [, updatedGoal] = await this.prisma.$transaction([
      this.prisma.goalContribution.create({
        data: { amount: dto.amount, note: dto.note, goalId },
      }),
      this.prisma.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: dto.amount } },
      }),
    ]);

    return updatedGoal;
  }

  async remove(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.userId !== userId) throw new ForbiddenException();
    return this.prisma.savingsGoal.delete({ where: { id } });
  }
}
