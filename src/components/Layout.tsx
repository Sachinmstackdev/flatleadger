import React, { useState } from 'react';
import { Home, Plus, ShoppingCart, LogOut, History, Menu, X } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { currentUser, setCurrentUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-expense', label: 'Add Expense', icon: Plus },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FlatLedger
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`w-8 h-8 ${currentUser?.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                  {currentUser?.avatar}
                </div>
                <span className="text-gray-700 font-medium hidden md:inline">{currentUser?.name}</span>
              </div>
              
              {/* Mobile user indicator */}
              <div className="sm:hidden">
                <div className={`w-8 h-8 ${currentUser?.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                  {currentUser?.avatar}
                </div>
              </div>
              
              <button
                onClick={() => setCurrentUser(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 hidden sm:block"
              >
                <LogOut className="w-5 h-5" />
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 sm:hidden"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Menu */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white/95 backdrop-blur-lg border-l border-white/20 z-50 transform transition-transform duration-300 sm:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${currentUser?.bgColor} rounded-lg flex items-center justify-center text-white text-sm`}>
                {currentUser?.avatar}
              </div>
              <span className="text-gray-700 font-medium">{currentUser?.name}</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setCurrentUser(null);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="bg-white/60 backdrop-blur-lg border-b border-white/20 hidden sm:block">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4 md:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3 md:px-4 py-3 border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-white/20 z-40 sm:hidden">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-4 md:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;