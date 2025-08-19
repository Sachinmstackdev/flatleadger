import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { USERS } from '../data/users';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('flatleger-user');
    if (savedUserId) {
      const user = USERS.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('flatleger-user', user.id);
    } else {
      localStorage.removeItem('flatleger-user');
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </UserContext.Provider>
  );
};