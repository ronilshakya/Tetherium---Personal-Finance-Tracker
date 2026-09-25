import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: { ...dto, userId },
      include: { category: true },
    });
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
