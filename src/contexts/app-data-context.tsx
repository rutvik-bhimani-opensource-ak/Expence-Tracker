
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, BudgetGoal, Account, Category } from '@/lib/types';
// AllCategories is not directly used in this file anymore, but Expense/IncomeCategories are used in AddTransactionDialog
// For simplicity, if not needed here directly, we could remove the AllCategories import.
// For now, keeping it as it doesn't harm.
import { AllCategories } from '@/lib/types'; 

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
  getAllData: () => { transactions: Transaction[]; budgets: BudgetGoal[]; accounts: Account[], systemMonth: number, systemYear: number };
}

const AppDataContext = createContext<AppDataDataContextType | undefined>(undefined);

const initialDemoTransactions: Transaction[] = [
  { id: '1', date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2).toISOString(), description: 'Groceries', amount: 75.50, category: 'Food', type: 'expense', vendor: 'SuperMart' },
  { id: '2', date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1).toISOString(), description: 'Salary Deposit', amount: 2500, category: 'Salary', type: 'income', vendor: 'Tech Corp' },
  { id: '3', date: new Date().toISOString(), description: 'Coffee', amount: 4.75, category: 'Food', type: 'expense', vendor: 'Cafe Central' },
];

const initialDemoBudgets: BudgetGoal[] = [
  { id: 'b1', category: 'Food', limit: 400, spent: 0 },
  { id: 'b2', category: 'Entertainment', limit: 100, spent: 0 },
];

const initialDemoAccounts: Account[] = [
  { id: 'a1', name: 'Main Checking Account', balance: 5000 },
];

const LOCAL_STORAGE_KEY_TRANSACTIONS = 'frugalflow_transactions';
const LOCAL_STORAGE_KEY_BUDGETS = 'frugalflow_budgets';
const LOCAL_STORAGE_KEY_ACCOUNTS = 'frugalflow_accounts';
const LOCAL_STORAGE_KEY_SYSTEM_MONTH = 'frugalflow_systemMonth';
const LOCAL_STORAGE_KEY_SYSTEM_YEAR = 'frugalflow_systemYear';


export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [systemMonth, setSystemMonthState] = useState<number>(new Date().getMonth());
  const [systemYear, setSystemYearState] = useState<number>(new Date().getFullYear());
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    const storedBudgets = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGETS);
    const storedAccounts = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    const storedSystemMonth = localStorage.getItem(LOCAL_STORAGE_KEY_SYSTEM_MONTH);
    const storedSystemYear = localStorage.getItem(LOCAL_STORAGE_KEY_SYSTEM_YEAR);

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions(initialDemoTransactions);
    }
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      setBudgets(initialDemoBudgets);
    }
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    } else {
      setAccounts(initialDemoAccounts);
    }
    if (storedSystemMonth) {
      setSystemMonthState(JSON.parse(storedSystemMonth));
    } else {
      setSystemMonthState(new Date().getMonth());
    }
    if (storedSystemYear) {
      setSystemYearState(JSON.parse(storedSystemYear));
    } else {
      setSystemYearState(new Date().getFullYear());
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    }
  }, [budgets, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }
  }, [accounts, isLoaded]);
  
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_MONTH, JSON.stringify(systemMonth));
    }
  }, [systemMonth, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_YEAR, JSON.stringify(systemYear));
    }
  }, [systemYear, isLoaded]);


  const getCategorySpentAmount = useCallback((category: Category, month: number, year: number): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && t.category === category && tDate.getMonth() === month && tDate.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Recalculate budget spent amounts when transactions or system date change
  useEffect(() => {
    if (isLoaded) { // Only run if initial load from localStorage is complete
      setBudgets(prevBudgets =>
        prevBudgets.map(budget => ({
          ...budget,
          spent: getCategorySpentAmount(budget.category, systemMonth, systemYear),
        }))
      );
    }
  }, [transactions, systemMonth, systemYear, getCategorySpentAmount, isLoaded]);


  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: Date.now().toString() + Math.random().toString(36).substring(2, 15) };
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15), 
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
    const newAccount = { ...account, id: Date.now().toString() + Math.random().toString(36).substring(2, 15) };
    if (accounts.length > 0) {
      setAccounts([{ ...newAccount, id: accounts[0].id }]); 
    } else {
      setAccounts([newAccount]); 
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
    setBudgets([]); 
    setAccounts(prevAccounts =>
      prevAccounts.length > 0 ? [{ ...prevAccounts[0], balance: 0 }] : []
    );
    // System date (month/year) remains as is by default, or could be reset to current actual date
    // For now, it keeps the user-set system date.
    
    localStorage.removeItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_BUDGETS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    // Optionally reset system date in localStorage too, or leave it
    // localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_MONTH, JSON.stringify(new Date().getMonth()));
    // localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_YEAR, JSON.stringify(new Date().getFullYear()));
    // setSystemMonthState(new Date().getMonth()); // if you want to reset system date to actual current
    // setSystemYearState(new Date().getFullYear());
  };
  
  const getAllData = () => {
    return { transactions, budgets, accounts, systemMonth, systemYear };
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
      {isLoaded ? children : null /* Or a loading spinner */}
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

