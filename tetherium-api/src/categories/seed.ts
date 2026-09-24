import { TransactionType } from '@prisma/client';

export interface DefaultCategory {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Groceries',
    type: 'EXPENSE',
    icon: 'cart-outline',
    color: '#16a34a',
  },
  { name: 'Rent', type: 'EXPENSE', icon: 'home-outline', color: '#dc2626' },
  { name: 'Transport', type: 'EXPENSE', icon: 'car-outline', color: '#2563eb' },
  {
    name: 'Entertainment',
    type: 'EXPENSE',
    icon: 'film-outline',
    color: '#9333ea',
  },
  {
    name: 'Other',
    type: 'EXPENSE',
    icon: 'ellipsis-horizontal',
    color: '#6b7280',
  },
  { name: 'Salary', type: 'INCOME', icon: 'cash-outline', color: '#16a34a' },
];
