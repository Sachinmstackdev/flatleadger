import React from 'react';
import { TrendingUp, Users, Receipt, Wallet, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { Expense, Balance } from '../types';
import { calculateBalances, getTotalExpenses, formatCurrency } from '../utils/calculations';
import { USERS } from '../data/users';

const Dashboard: React.FC = () => {
  const { expenses, loading, error, getExpensesByMonth, getDailyExpenseSummary, getMonthlyExpenseSummary } = useExpenses();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const balances = calculateBalances(expenses);
  const totalExpenses = getTotalExpenses(expenses);
  const perPersonAmount = totalExpenses / 3;
  
  // Get current month expenses
  const now = new Date();
  const currentMonthExpenses = getExpensesByMonth(now.getFullYear(), now.getMonth() + 1);
  const currentMonthTotal = getTotalExpenses(currentMonthExpenses);
  
  // Get today's expenses
  const today = now.toISOString().split('T')[0];
  const todayExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    return expenseDate === today;
  });
  const todayTotal = getTotalExpenses(todayExpenses);
  
  // Get monthly summary for trends
  const monthlyData = getMonthlyExpenseSummary();
  const monthlyEntries = Object.entries(monthlyData).sort().slice(-6); // Last 6 months

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `Gets back ${formatCurrency(balance)}`;
    if (balance < 0) return `Owes ${formatCurrency(Math.abs(balance))}`;
    return 'All settled up!';
  };

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl self-start">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total Expenses</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl self-start">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Per Person</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(perPersonAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl self-start">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Transactions</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{expenses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl self-start">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">This Month</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(currentMonthTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 col-span-2 lg:col-span-1">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="bg-orange-100 p-2 md:p-3 rounded-lg md:rounded-xl self-start">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Today</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{formatCurrency(todayTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Balances */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Balances</h2>
          <div className="space-y-4">
            {balances.map((balance) => {
              const user = USERS.find(u => u.id === balance.userId);
              if (!user) return null;
              
              return (
                <div key={balance.userId} className="flex items-center justify-between p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 ${user.bgColor} rounded-lg flex items-center justify-center text-white text-sm md:text-base`}>
                      {user.avatar}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm md:text-base">{user.name}</h3>
                      <p className={`text-xs md:text-sm ${getBalanceColor(balance.netBalance)}`}>
                        {getBalanceText(balance.netBalance)}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold text-sm md:text-base ${getBalanceColor(balance.netBalance)}`}>
                    {balance.netBalance !== 0 && formatCurrency(Math.abs(balance.netBalance))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Recent Expenses</h2>
          <div className="space-y-4">
            {recentExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">No expenses yet. Add your first expense!</p>
            ) : (
              recentExpenses.map((expense) => {
                const user = USERS.find(u => u.id === expense.paidBy);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${user?.bgColor} rounded-lg flex items-center justify-center text-white text-xs md:text-sm`}>
                        {user?.avatar}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm md:text-base">{expense.description}</h3>
                        <p className="text-xs md:text-sm text-gray-600">
                          Paid by {user?.name} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {expense.splitType === 'equal' 
                          ? `${formatCurrency(expense.amount / (expense.splitBetween?.length || 1))} each`
                          : expense.splitType === 'custom' 
                          ? 'Custom split'
                          : 'Loan/Advance'
                        }
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Monthly Trends</h2>
          <div className="space-y-4">
            {monthlyEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">No data available yet</p>
            ) : (
              monthlyEntries.map(([month, data]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                
                return (
                  <div key={month} className="flex items-center justify-between p-3 bg-white/50 rounded-lg md:rounded-xl">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm md:text-base">{monthName}</h3>
                      <p className="text-xs md:text-sm text-gray-600">{data.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{formatCurrency(data.total)}</p>
                      <p className="text-xs md:text-sm text-gray-600">{formatCurrency(data.total / 3)} per person</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown for Current Month */}
      {currentMonthExpenses.length > 0 && (
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
            Daily Breakdown - {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Object.entries(getDailyExpenseSummary()).sort().reverse().slice(0, 15).map(([date, data]) => (
              <div key={date} className="p-3 md:p-4 bg-white/50 rounded-lg md:rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800 text-sm md:text-base">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </h3>
                  <span className="text-xs md:text-sm text-gray-600">{data.count}</span>
                </div>
                <p className="text-base md:text-lg font-semibold text-gray-800">{formatCurrency(data.total)}</p>
                <p className="text-xs md:text-sm text-gray-600">{formatCurrency(data.total / 3)} each</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;