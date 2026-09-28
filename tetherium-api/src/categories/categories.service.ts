import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DEFAULT_CATEGORIES } from './seed';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async seedDefaultsForUser(userId: string) {
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: { ...dto, userId } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A category with this name already exists');
      }
      throw err;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A category with this name already exists');
      }
      throw err;
    }
  }

  findAll(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    if (category.userId !== userId) throw new ForbiddenException();

    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new ConflictException(
          'This category is used by existing transactions or budgets and cannot be deleted',
        );
      }
      throw err;
    }
  }
}
