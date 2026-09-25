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

  async getSpendingByCategory(userId: string, month: number, year: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });

    return grouped.map((g) => {
      const category = categories.find((c) => c.id === g.categoryId)!;
      return {
        categoryId: g.categoryId,
        categoryName: category.name,
        color: category.color,
        total: g._sum.amount ?? 0,
      };
    });
  }

  async getMonthlyTrend(userId: string, monthsBack: number = 6) {
    const now = new Date();
    const results: {
      month: number;
      year: number;
      income: number;
      expense: number;
    }[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);

      const [income, expense] = await Promise.all([
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
      ]);

      results.push({
        month,
        year,
        income: Number(income._sum.amount ?? 0),
        expense: Number(expense._sum.amount ?? 0),
      });
    }

    return results;
  }
}
