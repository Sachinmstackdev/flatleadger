import React, { useState } from 'react';
import { Calendar, Filter, Download, TrendingUp, Users } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency } from '../utils/calculations';
import { USERS } from '../data/users';

const ExpenseHistory: React.FC = () => {
  const { expenses, loading, getExpensesByMonth, getMonthlyExpenseSummary } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const [year, month] = selectedMonth.split('-').map(Number);
  const monthExpenses = getExpensesByMonth(year, month);
  
  // Filter expenses based on selected filters
  const filteredExpenses = monthExpenses.filter(expense => {
    if (selectedUser !== 'all' && expense.paidBy !== selectedUser) return false;
    if (selectedCategory !== 'all' && expense.category !== selectedCategory) return false;
    return true;
  });

  const monthlyData = getMonthlyExpenseSummary();
  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))];

  // Build participant list based on split type for display (avatars)
  const getParticipantsForDisplay = (expense: any) => {
    try {
      if (expense.splitType === 'equal') {
        return (expense.splitBetween || [])
          .map((id: string) => USERS.find(u => u.id === id))
          .filter(Boolean);
      }
      if (expense.splitType === 'custom' && expense.customSplits) {
        return Object.keys(expense.customSplits)
          .map((id: string) => USERS.find(u => u.id === id))
          .filter(Boolean);
      }
      if (expense.splitType === 'full_payment' && expense.loanTo) {
        return (expense.loanTo || [])
          .map((id: string) => USERS.find(u => u.id === id))
          .filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Description', 'Amount', 'Paid By', 'Category', 'Split Amount'];
    const csvData = filteredExpenses.map(expense => {
      const user = USERS.find(u => u.id === expense.paidBy);
      const date = new Date(expense.date);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        expense.description,
        expense.amount,
        user?.name || expense.paidBy,
        expense.category || 'Uncategorized',
        (expense.amount / 3).toFixed(2)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerDay = totalAmount / new Date(year, month, 0).getDate();

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Expense History</h1>
              <p className="text-gray-600 text-sm md:text-base hidden md:block">Track and analyze your spending patterns</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm md:text-base"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline">Export CSV</span>
            <span className="md:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
          <div>
            <label htmlFor="history-month" className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <input
              id="history-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label htmlFor="history-paidby" className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
            <select
              id="history-paidby"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="all">All Users</option>
              {USERS.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="history-category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              id="history-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total This Month</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Average Per Day</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(averagePerDay)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Per Person</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(totalAmount / 3)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-base md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
          Expenses for {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          {filteredExpenses.length !== monthExpenses.length && (
            <span className="text-xs md:text-sm font-normal text-gray-600 ml-2">
              ({filteredExpenses.length} of {monthExpenses.length} shown)
            </span>
          )}
        </h2>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2">No expenses found</h3>
            <p className="text-gray-600 text-sm md:text-base">Try adjusting your filters or add some expenses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const user = USERS.find(u => u.id === expense.paidBy);
              const date = new Date(expense.date);
              
              return (
                <div key={expense.id} className="flex items-center justify-between p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl hover:bg-white/70 transition-colors duration-200">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className={`w-8 h-8 md:w-10 md:h-10 ${user?.bgColor} rounded-lg flex items-center justify-center text-white text-sm md:text-base flex-shrink-0`}>
                      {user?.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">{expense.description}</h3>
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-600 space-y-1 md:space-y-0">
                        <span className="flex items-center space-x-1">
                          <span>{date.toLocaleDateString()}</span>
                          <span className="hidden md:inline">•</span>
                          <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="hidden md:inline">Paid by {user?.name}</span>
                        <span className="md:hidden">{user?.name}</span>
                        {expense.category && (
                          <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-100 rounded-full text-xs">
                            {expense.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-lg font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {expense.splitType === 'equal' 
                        ? `${formatCurrency(expense.amount / (expense.splitBetween?.length || 1))} each`
                        : expense.splitType === 'custom' 
                        ? 'Custom split'
                        : 'Loan/Advance'
                      }
                    </p>
                    {/* Participants avatars */}
                    <div className="flex justify-end mt-1 -space-x-2">
                      {getParticipantsForDisplay(expense).slice(0, 5).map((u: any) => (
                        <div key={u.id} className={`w-5 h-5 md:w-6 md:h-6 ${u.bgColor} rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] md:text-xs`}>
                          {u.avatar}
                        </div>
                      ))}
                      {getParticipantsForDisplay(expense).length > 5 && (
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 text-gray-700 rounded-full border-2 border-white flex items-center justify-center text-[10px] md:text-xs">+{getParticipantsForDisplay(expense).length - 5}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      {Object.keys(monthlyData).length > 1 && (
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-base md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Monthly Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {Object.entries(monthlyData)
              .sort()
              .reverse()
              .slice(0, 6)
              .map(([month, data]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                });
                
                return (
                  <div key={month} className="p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl">
                    <h3 className="font-medium text-gray-800 mb-2 text-sm md:text-base">{monthName}</h3>
                    <p className="text-lg md:text-2xl font-bold text-gray-800 mb-1">{formatCurrency(data.total)}</p>
                    <p className="text-xs md:text-sm text-gray-600">{data.count} transactions</p>
                    <p className="text-xs md:text-sm text-gray-600">{formatCurrency(data.total / 3)} per person</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseHistory;