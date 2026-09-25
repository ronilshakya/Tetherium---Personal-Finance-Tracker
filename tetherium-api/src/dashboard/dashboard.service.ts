import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string, month: number, year: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const [incomeAgg, expenseAgg, allTimeIncome, allTimeExpense, budgets] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: monthStart, lt: monthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: monthStart, lt: monthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { userId, type: 'INCOME' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE' },
          _sum: { amount: true },
        }),
        this.prisma.budget.findMany({
          where: { userId, month, year },
          include: { category: true },
        }),
      ]);

    const monthIncome = incomeAgg._sum.amount ?? 0;
    const monthExpense = expenseAgg._sum.amount ?? 0;
    const totalBalance =
      Number(allTimeIncome._sum.amount ?? 0) -
      Number(allTimeExpense._sum.amount ?? 0);

    const budgetsWithSpend = await Promise.all(
      budgets.map(async (budget) => {
        const spend = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: { gte: monthStart, lt: monthEnd },
          },
          _sum: { amount: true },
        });
        return { ...budget, spent: spend._sum.amount ?? 0 };
      }),
    );

    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { category: true },
    });

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      budgets: budgetsWithSpend,
      recentTransactions,
    };
  }
}
