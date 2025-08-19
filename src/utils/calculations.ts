import { Expense, Balance, User } from '../types';
import { USERS } from '../data/users';

export const calculateBalances = (expenses: Expense[]): Balance[] => {
  const balances: { [userId: string]: Balance } = {};

  // Initialize balances
  USERS.forEach(user => {
    balances[user.id] = {
      userId: user.id,
      owes: {},
      owedBy: {},
      netBalance: 0
    };
  });

  // Calculate balances from expenses
  expenses.forEach(expense => {
    if (expense.splitType === 'equal') {
      const splitAmount = expense.amount / (expense.splitBetween?.length || 1);
      
      (expense.splitBetween || []).forEach(userId => {
        if (userId !== expense.paidBy) {
          // This user owes money to the person who paid
          if (!balances[userId].owes[expense.paidBy]) {
            balances[userId].owes[expense.paidBy] = 0;
          }
          balances[userId].owes[expense.paidBy] += splitAmount;

          // The person who paid is owed money
          if (!balances[expense.paidBy].owedBy[userId]) {
            balances[expense.paidBy].owedBy[userId] = 0;
          }
          balances[expense.paidBy].owedBy[userId] += splitAmount;
        }
      });
    } else if (expense.splitType === 'custom' && expense.customSplits) {
      Object.entries(expense.customSplits).forEach(([userId, amount]) => {
        if (userId !== expense.paidBy && amount > 0) {
          // This user owes money to the person who paid
          if (!balances[userId].owes[expense.paidBy]) {
            balances[userId].owes[expense.paidBy] = 0;
          }
          balances[userId].owes[expense.paidBy] += amount;

          // The person who paid is owed money
          if (!balances[expense.paidBy].owedBy[userId]) {
            balances[expense.paidBy].owedBy[userId] = 0;
          }
          balances[expense.paidBy].owedBy[userId] += amount;
        }
      });
    } else if (expense.splitType === 'full_payment' && expense.loanTo) {
      // Handle loans - the payer is owed the full amount by the borrowers
      const amountPerBorrower = expense.amount / expense.loanTo.length;
      
      expense.loanTo.forEach(borrowerId => {
        if (borrowerId !== expense.paidBy) {
          // Borrower owes money to the lender
          if (!balances[borrowerId].owes[expense.paidBy]) {
            balances[borrowerId].owes[expense.paidBy] = 0;
          }
          balances[borrowerId].owes[expense.paidBy] += amountPerBorrower;

          // Lender is owed money by the borrower
          if (!balances[expense.paidBy].owedBy[borrowerId]) {
            balances[expense.paidBy].owedBy[borrowerId] = 0;
          }
          balances[expense.paidBy].owedBy[borrowerId] += amountPerBorrower;
        }
      });
    }
  });

  // Calculate net balances
  Object.values(balances).forEach(balance => {
    const totalOwed = Object.values(balance.owedBy).reduce((sum, amount) => sum + amount, 0);
    const totalOwes = Object.values(balance.owes).reduce((sum, amount) => sum + amount, 0);
    balance.netBalance = totalOwed - totalOwes;
  });

  return Object.values(balances);
};

export const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

export const getExpensesByUser = (expenses: Expense[], userId: string): Expense[] => {
  return expenses.filter(expense => expense.paidBy === userId);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};