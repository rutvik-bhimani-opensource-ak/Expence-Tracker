
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Transaction, BudgetGoal, Account, Category } from '@/lib/types';
import { ExpenseCategories, IncomeCategories } // Assuming these are defined in types.ts
    from '@/lib/types';


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
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const initialDemoTransactions: Transaction[] = [
  { id: '1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Groceries', amount: 75.50, category: 'Food', type: 'expense', vendor: 'SuperMart' },
  { id: '2', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Salary Deposit', amount: 2500, category: 'Salary', type: 'income', vendor: 'Tech Corp' },
  { id: '3', date: new Date().toISOString(), description: 'Coffee', amount: 4.75, category: 'Food', type: 'expense', vendor: 'Cafe Central' },
  { id: '4', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Gas Bill', amount: 60.00, category: 'Utilities', type: 'expense', vendor: 'City Gas' },
  { id: '5', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Movie Tickets', amount: 30.00, category: 'Entertainment', type: 'expense', vendor: 'Cinema Plex' },
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

  useEffect(() => {
    // Update budget spent amounts whenever transactions change
    setBudgets(prevBudgets =>
      prevBudgets.map(budget => ({
        ...budget,
        spent: getCategorySpentAmount(budget.category, new Date().getMonth(), new Date().getFullYear()),
      }))
    );
  }, [transactions]);


  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions(prev => [newTransaction, ...prev]);
    // Adjust account balance
    if (accounts.length > 0) { // Assuming first account is the one to adjust
      const account = accounts[0];
      const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      updateAccountBalance(account.id, account.balance + amountChange);
    }
  };

  const deleteTransaction = (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    // Revert account balance adjustment
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
      spent: getCategorySpentAmount(budget.category, new Date().getMonth(), new Date().getFullYear()) 
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (updatedBudget: BudgetGoal) => {
    setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? { ...updatedBudget, spent: getCategorySpentAmount(updatedBudget.category, new Date().getMonth(), new Date().getFullYear()) } : b));
  };

  const deleteBudget = (budgetId: string) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: Date.now().toString() };
    setAccounts(prev => [...prev, newAccount]);
  };
  
  const updateAccount = (updatedAccount: Account) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };

  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
  };

  const getCategorySpentAmount = (category: Category, month: number, year: number): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && t.category === category && tDate.getMonth() === month && tDate.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <AppDataContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget,
      accounts, addAccount, updateAccountBalance, updateAccount,
      getCategorySpentAmount
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
