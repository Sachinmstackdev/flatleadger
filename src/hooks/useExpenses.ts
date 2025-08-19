import { useState, useEffect, useCallback } from 'react';
import { supabase, DatabaseExpense } from '../lib/supabase';
import { Expense } from '../types';
import { USERS } from '../data/users';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert database expense to app expense
  const convertToAppExpense = (dbExpense: DatabaseExpense): Expense => ({
    id: dbExpense.id,
    description: dbExpense.description,
    amount: dbExpense.amount,
    paidBy: dbExpense.paid_by,
    date: dbExpense.date,
    category: dbExpense.category,
    // For equal splits, rely on stored participant ids in loan_to
    // (exactly the users selected in the UI; may or may not include payer).
    splitBetween: dbExpense.split_type === 'equal'
      ? ((dbExpense.loan_to as string[] | null) || [])
      : (dbExpense.custom_splits
        ? Object.keys(dbExpense.custom_splits)
        : (dbExpense.loan_to as string[] | null) || []),
    splitType: dbExpense.split_type as 'equal' | 'custom' | 'full_payment',
    customSplits: dbExpense.custom_splits || undefined,
    isLoan: dbExpense.is_loan || false,
    loanTo: dbExpense.loan_to || undefined,
    notes: dbExpense.notes || undefined
  });

  // Convert app expense to database expense
  const convertToDbExpense = (expense: Expense, currentUserId: string): Omit<DatabaseExpense, 'id' | 'created_at'> => {
    const now = new Date();
    
    // Calculate split amount based on split type
    let splitAmount = 0;
    if (expense.splitType === 'equal') {
      // For equal split, calculate based on selected users
      splitAmount = expense.amount / (expense.splitBetween?.length || 1);
    } else if (expense.splitType === 'custom' && expense.customSplits) {
      // For custom split, use the specified amount for current user
      splitAmount = expense.customSplits[currentUserId] || 0;
    } else if (expense.splitType === 'full_payment') {
      // For full payment, the split amount is the total amount
      splitAmount = expense.amount;
    }
    
    return {
      description: expense.description,
      amount: expense.amount,
      paid_by: currentUserId,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      time: now.toTimeString().split(' ')[0], // HH:MM:SS format
      split_amount: splitAmount,
      category: expense.category || null,
      split_type: expense.splitType,
      custom_splits: expense.customSplits || null,
      is_loan: expense.isLoan || false,
      // For equal splits, persist the exact selected participants (as-is)
      // so we can reconstruct the precise number of parts later.
      loan_to: expense.splitType === 'equal'
        ? (expense.splitBetween || [])
        : (expense.loanTo || null),
      notes: expense.notes || null
    };
  };

  // Fetch expenses from Supabase - memoized to prevent infinite loops
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching expenses from Supabase...');
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const convertedExpenses = data?.map(convertToAppExpense) || [];
      console.log(`Successfully fetched ${convertedExpenses.length} expenses`);
      setExpenses(convertedExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      
      if (err instanceof Error && err.message.includes('Missing Supabase environment variables')) {
        setError('Database connection not configured. Please check your environment variables.');
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Network error: Cannot connect to database. Check your internet connection.');
      } else {
        setError(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      setExpenses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new expense
  const addExpense = async (expense: Omit<Expense, 'id'>, currentUserId: string) => {
    try {
      const dbExpense = convertToDbExpense(expense as Expense, currentUserId);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([dbExpense])
        .select()
        .single();

      if (error) throw error;

      const newExpense = convertToAppExpense(data);
      
      // Update local state immediately and ensure it's at the top
      setExpenses(prev => {
        // Remove any duplicate entries (in case real-time subscription added it)
        const filtered = prev.filter(e => e.id !== newExpense.id);
        return [newExpense, ...filtered];
      });
      
      console.log('Expense added successfully:', newExpense);
      return newExpense;
    } catch (err) {
      console.error('Error adding expense:', err);
      throw new Error('Failed to add expense');
    }
  };

  // Get expenses by date range
  const getExpensesByDateRange = (startDate: string, endDate: string) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  // Get expenses by month
  const getExpensesByMonth = (year: number, month: number) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return getExpensesByDateRange(startDate, endDate);
  };

  // Get expenses by day
  const getExpensesByDay = (date: string) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate === date;
    });
  };

  // Get monthly summary
  const getMonthlyExpenseSummary = () => {
    const monthlyData: { [key: string]: { total: number; count: number; expenses: Expense[] } } = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0, expenses: [] };
      }
      
      monthlyData[monthKey].total += expense.amount;
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].expenses.push(expense);
    });
    
    return monthlyData;
  };

  // Get daily summary for current month
  const getDailyExpenseSummary = (year?: number, month?: number) => {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    
    const monthExpenses = getExpensesByMonth(targetYear, targetMonth);
    const dailyData: { [key: string]: { total: number; count: number; expenses: Expense[] } } = {};
    
    monthExpenses.forEach(expense => {
      const date = new Date(expense.date).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, count: 0, expenses: [] };
      }
      
      dailyData[date].total += expense.amount;
      dailyData[date].count += 1;
      dailyData[date].expenses.push(expense);
    });
    
    return dailyData;
  };

  useEffect(() => {
    fetchExpenses();

    // Set up real-time subscription with debouncing
    let timeoutId: NodeJS.Timeout;
    
    const subscription = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Debounce the refetch to prevent multiple rapid calls
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchExpenses();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    addExpense,
    getExpensesByDateRange,
    getExpensesByMonth,
    getExpensesByDay,
    getMonthlyExpenseSummary,
    getDailyExpenseSummary,
    refetch: fetchExpenses
  };
};