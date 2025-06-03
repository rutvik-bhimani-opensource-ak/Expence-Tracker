
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, BudgetGoal, Account, Category } from '@/lib/types';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  Timestamp,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';

interface AppDataContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'spent'>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  budgets: BudgetGoal[];
  addBudget: (budget: Omit<BudgetGoal, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (budget: BudgetGoal) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccountBalance: (accountId: string, newBalance: number) => Promise<void>; // Balance updates handled via transactions mostly
  updateAccount: (account: Account) => Promise<void>; // For account name changes mainly
  getCategorySpentAmount: (category: Category, month: number, year: number) => number;
  systemMonth: number;
  systemYear: number;
  setSystemDate: (month: number, year: number) => Promise<void>;
  resetAllData: () => Promise<void>;
  getAllData: () => Promise<{ transactions: Transaction[]; budgets: BudgetGoal[]; accounts: Account[], systemMonth: number, systemYear: number }>;
  isDataLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const TRANSACTIONS_COLLECTION = 'transactions';
const BUDGETS_COLLECTION = 'budgets';
const ACCOUNTS_COLLECTION = 'accounts'; // Will store a single document for the primary account
const APP_SETTINGS_DOC = 'app_settings'; // Document to store systemMonth and systemYear

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [systemMonth, setSystemMonthState] = useState<number>(new Date().getMonth());
  const [systemYear, setSystemYearState] = useState<number>(new Date().getFullYear());
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch initial settings (systemMonth, systemYear)
  useEffect(() => {
    setIsDataLoading(true);
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSystemMonthState(data.systemMonth ?? new Date().getMonth());
        setSystemYearState(data.systemYear ?? new Date().getFullYear());
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsDocRef, { 
          systemMonth: new Date().getMonth(), 
          systemYear: new Date().getFullYear() 
        });
      }
    }, (error) => {
      console.error("Error fetching app settings:", error);
    });
    return () => unsubscribe();
  }, []);
  
  // Transactions listener
  useEffect(() => {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTransactions.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate().toISOString(), // Convert Firestore Timestamp to ISO string
        } as Transaction);
      });
      setTransactions(fetchedTransactions);
      if(isDataLoading) setIsDataLoading(false); // Assume data loaded after first transaction fetch
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setIsDataLoading(false);
    });
    return () => unsubscribe();
  }, [isDataLoading]); // Added isDataLoading to deps, might need refinement

  // Accounts listener (assuming one primary account)
  useEffect(() => {
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary'); // Fixed ID for the single account
    const unsubscribe = onSnapshot(accountDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAccounts([{ id: docSnap.id, ...docSnap.data() } as Account]);
      } else {
        // Create a default account if none exists
        const defaultAccount: Omit<Account, 'id'> = { name: 'Main Account', balance: 0 };
        setDoc(accountDocRef, defaultAccount)
          .then(() => setAccounts([{ id: 'primary', ...defaultAccount }]))
          .catch(err => console.error("Error creating default account:", err));
      }
       if(isDataLoading && transactions.length === 0) setIsDataLoading(false); // If no transactions, account signals loading end
    }, (error) => {
      console.error("Error fetching account:", error);
      if(isDataLoading && transactions.length === 0) setIsDataLoading(false);
    });
    return () => unsubscribe();
  }, [isDataLoading, transactions.length]);


  const getCategorySpentAmount = useCallback((category: Category, month: number, year: number): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && t.category === category && tDate.getMonth() === month && tDate.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Budgets listener & recalculate spent amounts
   useEffect(() => {
    const q = query(collection(db, BUDGETS_COLLECTION));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedBudgets: BudgetGoal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedBudgets.push({
          id: doc.id,
          ...data,
          spent: getCategorySpentAmount(data.category, systemMonth, systemYear),
        } as BudgetGoal);
      });
      setBudgets(fetchedBudgets);
    }, (error) => {
      console.error("Error fetching budgets:", error);
    });
    
    // This part ensures 'spent' is updated if only systemMonth/Year or transactions change,
    // without re-fetching budgets, assuming budgets are already loaded.
    setBudgets(prevBudgets =>
        prevBudgets.map(budget => ({
          ...budget,
          spent: getCategorySpentAmount(budget.category, systemMonth, systemYear),
        }))
      );

    return () => unsubscribe();
  }, [transactions, systemMonth, systemYear, getCategorySpentAmount]);


  const updateAccountBalanceFirestore = async (amountChange: number) => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const newBalance = account.balance + amountChange;
      const accountDocRef = doc(db, ACCOUNTS_COLLECTION, account.id);
      await updateDoc(accountDocRef, { balance: newBalance });
    }
  };
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const transactionWithTimestamp = {
      ...transaction,
      date: Timestamp.fromDate(new Date(transaction.date)), // Convert ISO string to Firestore Timestamp
      createdAt: serverTimestamp() 
    };
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionWithTimestamp);
    const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    await updateAccountBalanceFirestore(amountChange);
  };

  const deleteTransaction = async (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;
    
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId));
    const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
    await updateAccountBalanceFirestore(amountChange);
  };
  
  const addBudget = async (budget: Omit<BudgetGoal, 'id' | 'spent'>) => {
    // 'spent' will be calculated by the listener based on current transactions & systemDate
    await addDoc(collection(db, BUDGETS_COLLECTION), budget);
  };

  const updateBudget = async (updatedBudget: BudgetGoal) => {
    const { id, spent, ...budgetData } = updatedBudget; // 'spent' is dynamic, not stored
    await updateDoc(doc(db, BUDGETS_COLLECTION, id), budgetData);
  };

  const deleteBudget = async (budgetId: string) => {
    await deleteDoc(doc(db, BUDGETS_COLLECTION, budgetId));
  };

  // addAccount is mostly for initial setup or if primary account is deleted by mistake.
  // App assumes a single primary account.
  const addAccount = async (account: Omit<Account, 'id'>) => {
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
    await setDoc(accountDocRef, account); // Use setDoc to ensure only one 'primary' account
  };
  
  const updateAccount = async (updatedAccount: Account) => {
    // Only allow updating the primary account's name. Balance is managed via transactions.
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
    await updateDoc(accountDocRef, { name: updatedAccount.name });
  };

  const updateAccountBalance = async (accountId: string, newBalance: number) => {
    // This function is mainly for settings page to directly set balance.
    // AccountId should always be 'primary' in this single-account model.
    if (accountId === 'primary') {
        const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
        await updateDoc(accountDocRef, { balance: newBalance });
    }
  };

  const setSystemDate = async (month: number, year: number) => {
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    await setDoc(settingsDocRef, { systemMonth: month, systemYear: year }, { merge: true });
    // State will update via onSnapshot listener for settings
  };

  const resetAllData = async () => {
    setIsDataLoading(true);
    const batch = writeBatch(db);

    const transactionsSnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    transactionsSnapshot.forEach(doc => batch.delete(doc.ref));

    const budgetsSnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
    budgetsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // Reset primary account balance to 0, but keep the account document
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
    const accountSnap = await getDoc(accountDocRef);
    if (accountSnap.exists()) {
        batch.update(accountDocRef, { balance: 0 });
    } else {
        // If somehow primary account doc is gone, re-create it with 0 balance
        batch.set(accountDocRef, { name: "Main Account", balance: 0 });
    }


    // Reset system date to current actual month/year
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    batch.set(settingsDocRef, { systemMonth: currentMonth, systemYear: currentYear });
    
    await batch.commit();
    // Local state will update via onSnapshot listeners
    setIsDataLoading(false);
  };
  
  const getAllData = async () => {
    // This function will now fetch from Firestore directly for export.
    // Note: This fetches a snapshot, not using the real-time data in state directly,
    // to ensure it gets the latest at the moment of export.
    const transactionsSnapshot = await getDocs(query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc')));
    const exportedTransactions = transactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data(), date: (d.data().date as Timestamp).toDate().toISOString() })) as Transaction[];

    const budgetsSnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
    const exportedBudgets = budgetsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BudgetGoal[]; // 'spent' is not stored

    let exportedAccounts: Account[] = [];
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
    const accountSnap = await getDoc(accountDocRef);
    if (accountSnap.exists()) {
        exportedAccounts.push({id: accountSnap.id, ...accountSnap.data()} as Account)
    }
    
    // Get current systemMonth/Year from state as it's reactive
    return { 
        transactions: exportedTransactions, 
        budgets: exportedBudgets.map(b => ({...b, spent: getCategorySpentAmount(b.category, systemMonth, systemYear)})), // Add dynamic spent for export
        accounts: exportedAccounts, 
        systemMonth, 
        systemYear 
    };
  };

  return (
    <AppDataContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget,
      accounts, addAccount, updateAccountBalance, updateAccount,
      getCategorySpentAmount,
      systemMonth, systemYear, setSystemDate,
      resetAllData, getAllData,
      isDataLoading
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
