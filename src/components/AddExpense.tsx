import React, { useState } from 'react';
import { Plus, Receipt, Users, Calculator, CreditCard, Info } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useExpenses } from '../hooks/useExpenses';
import { Expense } from '../types';
import { USERS } from '../data/users';
import { formatCurrency } from '../utils/calculations';

const AddExpense: React.FC = () => {
  const { currentUser } = useUser();
  const { expenses, addExpense, loading, refetch } = useExpenses();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'full_payment'>('equal');
  // Start with no users selected
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<{ [userId: string]: string }>({});
  const [isLoan, setIsLoan] = useState(false);
  const [loanTo, setLoanTo] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const categories = [
    'Groceries', 'Utilities', 'Rent', 'Food & Dining', 'Transportation', 
    'Entertainment', 'Household Items', 'Medical', 'Other'
  ];

  // Handle split type change
  const handleSplitTypeChange = (type: 'equal' | 'custom' | 'full_payment') => {
    setSplitType(type);
    // Reset selections when changing split type; do not auto-include current user
    setSelectedUsers([]);
    setCustomSplits({});
    setIsLoan(type === 'full_payment');
    setLoanTo([]);
  };

  // Handle user selection for equal split
  const handleUserToggle = (userId: string) => {
    if (splitType === 'equal') {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else if (splitType === 'custom') {
      const newSplits = { ...customSplits };
      if (selectedUsers.includes(userId)) {
        setSelectedUsers(prev => prev.filter(id => id !== userId));
        delete newSplits[userId];
      } else {
        setSelectedUsers(prev => [...prev, userId]);
        newSplits[userId] = '';
      }
      setCustomSplits(newSplits);
    }
  };

  // Handle custom split amount change
  const handleCustomSplitChange = (userId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  // Handle loan recipient toggle
  const handleLoanToToggle = (userId: string) => {
    setLoanTo(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Calculate totals for validation
  const getTotalCustomSplit = () => {
    return Object.values(customSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  };

  const isValidCustomSplit = () => {
    const total = getTotalCustomSplit();
    const expenseAmount = parseFloat(amount) || 0;
    return Math.abs(total - expenseAmount) < 0.01; // Allow for small rounding differences
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !description.trim() || !amount || parseFloat(amount) <= 0) return;

    // Validation for different split types
    if (splitType === 'equal') {
      if (selectedUsers.length === 0) {
        alert('Please select at least one person to split the expense with.');
        return;
      }
    }

    if (splitType === 'custom' && !isValidCustomSplit()) {
      alert(`Custom splits must add up to ${formatCurrency(parseFloat(amount))}. Current total: ${formatCurrency(getTotalCustomSplit())}`);
      return;
    }

    if (splitType === 'full_payment' && loanTo.length === 0) {
      alert('Please select who you paid for.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Prepare custom splits for database
      let finalCustomSplits: { [userId: string]: number } | undefined;
      if (splitType === 'custom') {
        finalCustomSplits = {};
        Object.entries(customSplits).forEach(([userId, value]) => {
          const numValue = parseFloat(value) || 0;
          if (numValue > 0) {
            finalCustomSplits![userId] = numValue;
          }
        });
      }

      const newExpense: Omit<Expense, 'id'> = {
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy: currentUser.id,
        date: new Date().toISOString(),
        category: category || undefined,
        splitBetween: splitType === 'equal' ? selectedUsers : 
                     splitType === 'custom' ? selectedUsers :
                     loanTo,
        splitType,
        customSplits: finalCustomSplits,
        isLoan: splitType === 'full_payment',
        loanTo: splitType === 'full_payment' ? loanTo : undefined,
        notes: notes.trim() || undefined
      };

      await addExpense(newExpense, currentUser.id);

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setSplitType('equal');
      setSelectedUsers([]);
      setCustomSplits({});
      setIsLoan(false);
      setLoanTo([]);
      setNotes('');
      setSuccessMessage('Expense added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate preview amounts
  const getPreviewAmounts = () => {
    const expenseAmount = parseFloat(amount) || 0;
    if (splitType === 'equal') {
      // For equal split, only show selected users
      if (selectedUsers.length === 0) return [];
      const splitAmount = expenseAmount / selectedUsers.length;
      return selectedUsers.map(userId => ({
        userId,
        amount: splitAmount
      }));
    } else if (splitType === 'custom') {
      // For custom split, show only users with amounts
      return Object.entries(customSplits)
        .filter(([_, value]) => value !== '')
        .map(([userId, value]) => ({
          userId,
          amount: parseFloat(value) || 0
        }));
    } else if (splitType === 'full_payment') {
      // For full payment, split between selected recipients
      if (loanTo.length === 0) return [];
      const splitAmount = expenseAmount / loanTo.length;
      return loanTo.map(userId => ({
        userId,
        amount: splitAmount
      }));
    }
    return [];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-8">
        <div className="flex items-center space-x-4 mb-6 md:mb-8">
          <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Add Expense</h1>
            <p className="text-gray-600 text-sm md:text-base">Record a shared expense</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              What did you buy?
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Groceries from Big Bazaar"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              How much did you spend?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base">₹</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category (optional)
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Split Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How do you want to split this expense?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSplitTypeChange('equal')}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  splitType === 'equal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Equal Split</div>
                <div className="text-xs text-gray-600">Split equally among selected people</div>
              </button>

              <button
                type="button"
                onClick={() => handleSplitTypeChange('custom')}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  splitType === 'custom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calculator className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Custom Split</div>
                <div className="text-xs text-gray-600">Set different amounts for each person</div>
              </button>

              <button
                type="button"
                onClick={() => handleSplitTypeChange('full_payment')}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  splitType === 'full_payment'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">I Paid For Others</div>
                <div className="text-xs text-gray-600">You paid the full amount for someone else</div>
              </button>
            </div>
          </div>

          {/* User Selection for Equal Split */}
          {splitType === 'equal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who should split this expense?
              </label>
              <div className="space-y-2">
                {USERS.map((user) => (
                  <label key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select ${user.name} for equal split`}
                    />
                    <div className={`w-8 h-8 ${user.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {user.avatar}
                    </div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                    {user.id === currentUser?.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Split Amounts */}
          {splitType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Set custom amounts for each person
              </label>
              <div className="space-y-3">
                {USERS.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select ${user.name} for custom split`}
                    />
                    <div className={`w-8 h-8 ${user.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {user.avatar}
                    </div>
                    <span className="font-medium text-gray-800 flex-1">{user.name}</span>
                    {selectedUsers.includes(user.id) && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">₹</span>
                        <input
                          type="number"
                          value={customSplits[user.id] || ''}
                          onChange={(e) => handleCustomSplitChange(user.id, e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {amount && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total splits: {formatCurrency(getTotalCustomSplit())}</span>
                    <span>Expense amount: {formatCurrency(parseFloat(amount))}</span>
                  </div>
                  {!isValidCustomSplit() && (
                    <div className="text-red-600 text-xs mt-1 flex items-center space-x-1">
                      <Info className="w-4 h-4" />
                      <span>Splits must add up to the total expense amount</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loan Recipients */}
          {splitType === 'full_payment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who did you pay for? (They will owe you the money)
              </label>
              <div className="space-y-2">
                {USERS.filter(u => u.id !== currentUser?.id).map((user) => (
                  <label key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={loanTo.includes(user.id)}
                      onChange={() => handleLoanToToggle(user.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select ${user.name} as loan recipient`}
                    />
                    <div className={`w-8 h-8 ${user.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {user.avatar}
                    </div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about this expense..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base resize-none"
            />
          </div>

          {/* Split Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-800 text-sm md:text-base">
                  {splitType === 'equal' ? 'Equal Split Details' :
                   splitType === 'custom' ? 'Custom Split Details' :
                   'Loan Details'}
                </h3>
              </div>
              <div className="space-y-2">
                {getPreviewAmounts().map(({ userId, amount: userAmount }) => {
                  const user = USERS.find(u => u.id === userId);
                  if (!user || userAmount === 0) return null;
                  
                  return (
                    <div key={userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 md:w-6 md:h-6 ${user.bgColor} rounded-lg flex items-center justify-center text-white text-xs`}>
                          {user.avatar}
                        </div>
                        <span className="text-blue-700 text-sm md:text-base">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded">You</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-blue-800 font-medium text-sm md:text-base">
                          {formatCurrency(userAmount)}
                        </span>
                        {splitType === 'full_payment' && (
                          <div className="text-xs text-blue-600">owes you</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg md:rounded-xl p-4 mb-4">
              <p className="text-green-800 font-medium text-sm md:text-base">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting || 
              !description.trim() || 
              !amount || 
              parseFloat(amount) <= 0 ||
              (splitType === 'equal' && selectedUsers.length === 0) ||
              (splitType === 'custom' && !isValidCustomSplit()) ||
              (splitType === 'full_payment' && loanTo.length === 0)
            }
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg md:rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 text-base"
          >
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </button>
        </form>

        {expenses.length > 0 && (
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200">
            <h3 className="text-base md:text-lg font-medium text-gray-800 mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {expenses.slice(0, 3).map((expense) => {
                const user = USERS.find(u => u.id === expense.paidBy);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 md:w-8 md:h-8 ${user?.bgColor} rounded-lg flex items-center justify-center text-white text-xs md:text-sm`}>
                        {user?.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm md:text-base">{expense.description}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {expense.category} • {new Date(expense.date).toLocaleDateString()}
                          {expense.splitType !== 'equal' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                              {expense.splitType === 'custom' ? 'Custom' : 'Loan'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {expense.splitType === 'equal' ? `${formatCurrency(expense.amount / expense.splitBetween.length)} each` :
                         expense.splitType === 'custom' ? 'Custom split' :
                         'Loan/Advance'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpense;