export const EXPENSE_CATEGORIES = [
  'Gold Savings',
  'SIP Savings',
  'Milk',
  'House Maintenance',
  'Internet bill',
  'Electricity',
  'Provisions',
  'Gas',
  'Flowers',
  'Vegetables',
  'Fruits',
  'Petrol',
  'Miscellaneous',
  'Other',
] as const;

export const INCOME_CATEGORIES = ['Adspark', 'Classes'] as const;

export const USERS = [
  { name: 'Praveen', pin: '1991' },
  { name: 'Sravani', pin: '1996' },
] as const;

export const ACCOUNTS = ['Personal', 'EM Office'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Gold Savings': '#f59e0b',
  'SIP Savings': '#8b5cf6',
  'Milk': '#60a5fa',
  'House Maintenance': '#f97316',
  'Internet bill': '#06b6d4',
  'Electricity': '#eab308',
  'Provisions': '#22c55e',
  'Gas': '#ef4444',
  'Flowers': '#ec4899',
  'Vegetables': '#14b8a6',
  'Fruits': '#a855f7',
  'Petrol': '#64748b',
  'Miscellaneous': '#6366f1',
  'Other': '#78716c',
  'Adspark': '#10b981',
  'Classes': '#3b82f6',
};

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  account: string;
  addedBy: string;
  date: string;
  note: string;
  monthKey: string;
  createdAt: number;
}
