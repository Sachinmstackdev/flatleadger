export interface User {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  avatar: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category?: string;
  splitBetween: string[];
  splitType: 'equal' | 'custom' | 'full_payment';
  customSplits?: { [userId: string]: number };
  isLoan?: boolean;
  loanTo?: string[];
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  completed: boolean;
  addedBy: string;
  addedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  archived: boolean;
}

export interface Balance {
  userId: string;
  owes: { [userId: string]: number };
  owedBy: { [userId: string]: number };
  netBalance: number;
}