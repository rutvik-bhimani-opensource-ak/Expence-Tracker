
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, BudgetGoal, Account, Category } from '@/lib/types';
import { AllCategories } from '@/lib/types'; // Assuming these are defined in types.ts

interface AppDataContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'spent'>) => void;
  deleteTransaction: (transactionId: string) => void;
  budgets: BudgetGoal[];
  addBudget: (budget: Omit<BudgetGoal, 'id' | 'spent'>) => void;
  updateBudget: (budget: BudgetGoal) => void;
  deleteBudget: (budgetId: string) => void;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  updateAccount: (account: Account) => void;
  getCategorySpentAmount: (category: Category, month: number, year: number) => number;
  systemMonth: number;
  systemYear: number;
  setSystemDate: (month: number, year: number) => void;
  resetAllData: () => void;
  getAllData: () => { transactions: Transaction[]; budgets: BudgetGoal[]; accounts: Account[] };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const initialDemoTransactions: Transaction[] = [
  { id: '1', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), description: 'Groceries', amount: 75.50, category: 'Food', type: 'expense', vendor: 'SuperMart' },
  { id: '2', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), description: 'Salary Deposit', amount: 2500, category: 'Salary', type: 'income', vendor: 'Tech Corp' },
  { id: '3', date: new Date().toISOString(), description: 'Coffee', amount: 4.75, category: 'Food', type: 'expense', vendor: 'Cafe Central' },
  { id: '4', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), description: 'Gas Bill', amount: 60.00, category: 'Utilities', type: 'expense', vendor: 'City Gas' },
  { id: '5', date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), description: 'Movie Tickets', amount: 30.00, category: 'Entertainment', type: 'expense', vendor: 'Cinema Plex' },
];

const initialDemoBudgets: BudgetGoal[] = [
  { id: 'b1', category: 'Food', limit: 400, spent: 0 },
  { id: 'b2', category: 'Entertainment', limit: 100, spent: 0 },
];

const initialDemoAccounts: Account[] = [
  { id: 'a1', name: 'Main Checking Account', balance: 5000 },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialDemoTransactions);
  const [budgets, setBudgets] = useState<BudgetGoal[]>(initialDemoBudgets);
  const [accounts, setAccounts] = useState<Account[]>(initialDemoAccounts);
  const [systemMonth, setSystemMonthState] = useState<number>(new Date().getMonth());
  const [systemYear, setSystemYearState] = useState<number>(new Date().getFullYear());

  const getCategorySpentAmount = useCallback((category: Category, month: number, year: number): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && t.category === category && tDate.getMonth() === month && tDate.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  useEffect(() => {
    setBudgets(prevBudgets =>
      prevBudgets.map(budget => ({
        ...budget,
        spent: getCategorySpentAmount(budget.category, systemMonth, systemYear),
      }))
    );
  }, [transactions, systemMonth, systemYear, getCategorySpentAmount]);


  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (accounts.length > 0) {
      const account = accounts[0];
      const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      updateAccountBalance(account.id, account.balance + amountChange);
    }
  };

  const deleteTransaction = (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    if (accounts.length > 0) {
      const account = accounts[0];
      const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
      updateAccountBalance(account.id, account.balance + amountChange);
    }
  };
  
  const addBudget = (budget: Omit<BudgetGoal, 'id' | 'spent'>) => {
    const newBudget = { 
      ...budget, 
      id: Date.now().toString(), 
      spent: getCategorySpentAmount(budget.category, systemMonth, systemYear) 
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (updatedBudget: BudgetGoal) => {
    setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? { ...updatedBudget, spent: getCategorySpentAmount(updatedBudget.category, systemMonth, systemYear) } : b));
  };

  const deleteBudget = (budgetId: string) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: Date.now().toString() };
    // For simplicity, this app currently supports one main account.
    // If adding, we replace the existing one or create if none.
    if (accounts.length > 0) {
      setAccounts([{ ...newAccount, id: accounts[0].id }]); // Update existing
    } else {
      setAccounts([newAccount]); // Add new
    }
  };
  
  const updateAccount = (updatedAccount: Account) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };

  const setSystemDate = (month: number, year: number) => {
    setSystemMonthState(month);
    setSystemYearState(year);
  };

  const resetAllData = () => {
    setTransactions([]);
    setBudgets([]); // Spent amounts will be 0 due to no transactions
    setAccounts(prevAccounts =>
      prevAccounts.map((acc, index) =>
        index === 0 ? { ...acc, balance: 0 } : acc // Reset balance of the first account to 0
      )
    );
    // System date (month/year) remains as is.
  };
  
  const getAllData = () => {
    return { transactions, budgets, accounts };
  };


  return (
    <AppDataContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget,
      accounts, addAccount, updateAccountBalance, updateAccount,
      getCategorySpentAmount,
      systemMonth, systemYear, setSystemDate,
      resetAllData, getAllData
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
