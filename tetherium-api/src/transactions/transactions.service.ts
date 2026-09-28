import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: { ...dto, userId },
      include: { category: true },
    });

    if (dto.type === 'EXPENSE') {
      await this.checkBudgetThresholds(
        userId,
        dto.categoryId,
        transaction.date,
        transaction.id,
        Number(dto.amount),
      );
    }

    return transaction;
  }

  private async checkBudgetThresholds(
    userId: string,
    categoryId: string,
    date: Date,
    excludeTransactionId: string,
    newAmount: number,
  ) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const budget = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: { userId, categoryId, month, year },
      },
      include: { category: true },
    });
    if (!budget) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.pushToken) return;

    const limit = Number(budget.limit);

    const spendBeforeAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
        id: { not: excludeTransactionId },
      },
      _sum: { amount: true },
    });

    const spentBefore = Number(spendBeforeAgg._sum.amount ?? 0);
    const spentAfter = spentBefore + newAmount;
    const previousPercent = (spentBefore / limit) * 100;
    const percent = (spentAfter / limit) * 100;

    // Only fire once per threshold crossing — check if this transaction pushed it over,
    // not just that it's currently over (otherwise every future transaction re-fires).
    if (previousPercent < 100 && percent >= 100) {
      await this.notificationsService.send(
        user.pushToken,
        'Budget exceeded',
        `You've gone over your ${budget.category.name} budget this month.`,
        { type: 'budget_exceeded', categoryId },
      );
    } else if (previousPercent < 90 && percent >= 90) {
      await this.notificationsService.send(
        user.pushToken,
        'Budget alert',
        `You're at ${Math.round(percent)}% of your ${budget.category.name} budget.`,
        { type: 'budget_warning', categoryId },
      );
    }
  }
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(userId, id);
    return this.prisma.transaction.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  findAll(
    userId: string,
    filters: { from?: Date; to?: Date; categoryId?: string; search?: string },
  ) {
    const { from, to, categoryId, search } = filters;

    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      include: { category: true },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.userId !== userId) throw new ForbiddenException();
    return transaction;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // reuses ownership check
    return this.prisma.transaction.delete({ where: { id } });
  }
}
