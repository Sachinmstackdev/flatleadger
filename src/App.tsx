import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import Shopping from './components/Shopping';
import ExpenseHistory from './components/ExpenseHistory';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-expense':
        return <AddExpense />;
      case 'shopping':
        return <Shopping />;
      case 'history':
        return <ExpenseHistory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;