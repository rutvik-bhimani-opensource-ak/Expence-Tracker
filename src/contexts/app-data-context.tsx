
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
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  budgets: BudgetGoal[];
  addBudget: (budget: Omit<BudgetGoal, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (budget: BudgetGoal) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  accounts: Account[]; // Will hold 'primary' and 'cash' accounts
  updateAccountBalance: (accountId: 'primary' | 'cash', newBalance: number) => Promise<void>;
  updateAccountName: (accountId: 'primary' | 'cash', newName: string) => Promise<void>;
  getCategorySpentAmount: (category: Category, month: number, year: number) => number;
  systemMonth: number;
  systemYear: number;
  setSystemDate: (month: number, year: number) => Promise<void>;
  resetAllData: () => Promise<void>;
  getAllData: () => Promise<{ transactions: Transaction[]; budgets: BudgetGoal[]; accounts: Account[], systemMonth: number, systemYear: number }>;
  isDataLoading: boolean;
  getAccountById: (accountId: 'primary' | 'cash') => Account | undefined;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const TRANSACTIONS_COLLECTION = 'transactions';
const BUDGETS_COLLECTION = 'budgets';
const ACCOUNTS_COLLECTION = 'accounts';
const APP_SETTINGS_DOC = 'app_settings';

const DEFAULT_PRIMARY_ACCOUNT_NAME = 'Main Account';
const DEFAULT_CASH_ACCOUNT_NAME = 'Cash Account';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [systemMonth, setSystemMonthState] = useState<number>(new Date().getMonth());
  const [systemYear, setSystemYearState] = useState<number>(new Date().getFullYear());
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Auto-update system date on app load if the real month/year has changed.
  useEffect(() => {
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedMonth = data.systemMonth;
        const storedYear = data.systemYear;

        // Check if the stored date matches the actual current date
        if (storedMonth !== currentMonth || storedYear !== currentYear) {
            // If not, update it in Firestore. The onSnapshot listener will then
            // receive this new value and update the state correctly.
            updateDoc(settingsDocRef, { systemMonth: currentMonth, systemYear: currentYear })
              .catch(err => console.error("Failed to auto-update system date:", err));
        }

        // Set the state from the (potentially updated) Firestore data
        setSystemMonthState(data.systemMonth ?? currentMonth);
        setSystemYearState(data.systemYear ?? currentYear);

      } else {
        // Doc doesn't exist, so create it with the current month and year.
        // onSnapshot will trigger again once it's created.
        setDoc(settingsDocRef, { 
          systemMonth: currentMonth, 
          systemYear: currentYear 
        }).catch(err => console.error("Failed to create initial system date:", err));
      }
    }, (error) => console.error("Error fetching app settings:", error));

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this check runs once on mount.
  
  // Accounts listener for 'primary' and 'cash'
  useEffect(() => {
    let primaryUnsub: (() => void) | undefined;
    let cashUnsub: (() => void) | undefined;
    let activeListeners = 2;

    const checkAllDataLoaded = () => {
      if (activeListeners === 0) {
          // Only set loading to false if transactions have also been attempted
          // This assumes transactions listener might already be running or will run
          if (!transactionsListenerAttached) { // Add a flag for this
            setIsDataLoading(false);
          }
      }
    };

    const setupAccountListener = (accountId: 'primary' | 'cash', defaultName: string) => {
      const accountDocRef = doc(db, ACCOUNTS_COLLECTION, accountId);
      return onSnapshot(accountDocRef, (docSnap) => {
        setAccounts(prevAccounts => {
          const existingAccount = prevAccounts.find(acc => acc.id === accountId);
          if (docSnap.exists()) {
            const newAccount = { id: accountId, ...docSnap.data() } as Account;
            return existingAccount 
              ? prevAccounts.map(acc => acc.id === accountId ? newAccount : acc)
              : [...prevAccounts, newAccount];
          } else {
            const defaultAccount: Account = { id: accountId, name: defaultName, balance: 0 };
            setDoc(accountDocRef, { name: defaultAccount.name, balance: defaultAccount.balance })
              .catch(err => console.error(`Error creating ${accountId} account:`, err));
            return existingAccount ? prevAccounts.filter(acc => acc.id !== accountId) : [...prevAccounts, defaultAccount];
          }
        });
        activeListeners = Math.max(0, activeListeners -1);
        checkAllDataLoaded();
      }, (error) => {
        console.error(`Error fetching ${accountId} account:`, error);
        activeListeners = Math.max(0, activeListeners -1);
        checkAllDataLoaded();
      });
    };
    
    primaryUnsub = setupAccountListener('primary', DEFAULT_PRIMARY_ACCOUNT_NAME);
    cashUnsub = setupAccountListener('cash', DEFAULT_CASH_ACCOUNT_NAME);
    
    return () => {
      primaryUnsub?.();
      cashUnsub?.();
    };
  }, []);

  let transactionsListenerAttached = false;
  // Transactions listener
  useEffect(() => {
    transactionsListenerAttached = true;
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTransactions.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate().toISOString(),
        } as Transaction);
      });
      setTransactions(fetchedTransactions);
      // If accounts are already loaded or attempted, and transactions are now loaded:
      if (accounts.length > 0 || !isDataLoading) { // Check !isDataLoading in case accounts failed but we proceed
          setIsDataLoading(false);
      }
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setIsDataLoading(false); // Set to false even on error to stop loading state
    });
    return () => unsubscribe();
  }, [accounts, isDataLoading]);


  const getCategorySpentAmount = useCallback((category: Category, month: number, year: number): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && t.category === category && tDate.getMonth() === month && tDate.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

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
    }, (error) => console.error("Error fetching budgets:", error));
    
    setBudgets(prevBudgets =>
        prevBudgets.map(budget => ({
          ...budget,
          spent: getCategorySpentAmount(budget.category, systemMonth, systemYear),
        }))
      );

    return () => unsubscribe();
  }, [transactions, systemMonth, systemYear, getCategorySpentAmount]);

  const updateAccountBalanceInFirestore = async (accountId: 'primary' | 'cash', amountChange: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      const newBalance = account.balance + amountChange;
      const accountDocRef = doc(db, ACCOUNTS_COLLECTION, accountId);
      await updateDoc(accountDocRef, { balance: newBalance });
    }
  };
  
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const transactionWithTimestamp = {
      ...transaction,
      date: Timestamp.fromDate(new Date(transaction.date)),
      createdAt: serverTimestamp() 
    };
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionWithTimestamp);
    const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    await updateAccountBalanceInFirestore(transaction.accountId, amountChange);
  };

  const deleteTransaction = async (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;
    
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId));
    const amountChange = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
    await updateAccountBalanceInFirestore(transactionToDelete.accountId, amountChange);
  };
  
  const addBudget = async (budget: Omit<BudgetGoal, 'id' | 'spent'>) => {
    await addDoc(collection(db, BUDGETS_COLLECTION), budget);
  };

  const updateBudget = async (updatedBudget: BudgetGoal) => {
    const { id, spent, ...budgetData } = updatedBudget;
    await updateDoc(doc(db, BUDGETS_COLLECTION, id), budgetData);
  };

  const deleteBudget = async (budgetId: string) => {
    await deleteDoc(doc(db, BUDGETS_COLLECTION, budgetId));
  };
  
  const updateAccountName = async (accountId: 'primary' | 'cash', newName: string) => {
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(accountDocRef, { name: newName });
  };

  const updateAccountBalance = async (accountId: 'primary' | 'cash', newBalance: number) => {
    const accountDocRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await updateDoc(accountDocRef, { balance: newBalance });
  };

  const setSystemDate = async (month: number, year: number) => {
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    await setDoc(settingsDocRef, { systemMonth: month, systemYear: year }, { merge: true });
  };

  const resetAllData = async () => {
    setIsDataLoading(true);
    const batch = writeBatch(db);

    const transactionsSnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    transactionsSnapshot.forEach(doc => batch.delete(doc.ref));

    const budgetsSnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
    budgetsSnapshot.forEach(doc => batch.delete(doc.ref));
    
    const primaryAccountDocRef = doc(db, ACCOUNTS_COLLECTION, 'primary');
    batch.update(primaryAccountDocRef, { balance: 0, name: DEFAULT_PRIMARY_ACCOUNT_NAME });
    
    const cashAccountDocRef = doc(db, ACCOUNTS_COLLECTION, 'cash');
    batch.update(cashAccountDocRef, { balance: 0, name: DEFAULT_CASH_ACCOUNT_NAME });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const settingsDocRef = doc(db, APP_SETTINGS_DOC, 'current');
    batch.set(settingsDocRef, { systemMonth: currentMonth, systemYear: currentYear });
    
    await batch.commit();
    // Local state will update via onSnapshot listeners
    // No need to setIsDataLoading(false) here, listeners will handle it.
  };
  
  const getAllData = async () => {
    const transactionsSnapshot = await getDocs(query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc')));
    const exportedTransactions = transactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data(), date: (d.data().date as Timestamp).toDate().toISOString() })) as Transaction[];

    const budgetsSnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
    const exportedBudgets = budgetsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BudgetGoal[];

    const exportedAccounts: Account[] = [];
    const primaryAccountSnap = await getDoc(doc(db, ACCOUNTS_COLLECTION, 'primary'));
    if (primaryAccountSnap.exists()) exportedAccounts.push({id: 'primary', ...primaryAccountSnap.data()} as Account);
    const cashAccountSnap = await getDoc(doc(db, ACCOUNTS_COLLECTION, 'cash'));
    if (cashAccountSnap.exists()) exportedAccounts.push({id: 'cash', ...cashAccountSnap.data()} as Account);
    
    return { 
        transactions: exportedTransactions, 
        budgets: exportedBudgets.map(b => ({...b, spent: getCategorySpentAmount(b.category, systemMonth, systemYear)})),
        accounts: exportedAccounts, 
        systemMonth, 
        systemYear 
    };
  };

  const getAccountById = (accountId: 'primary' | 'cash'): Account | undefined => {
    return accounts.find(acc => acc.id === accountId);
  };

  return (
    <AppDataContext.Provider value={{ 
      transactions, addTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget,
      accounts, updateAccountBalance, updateAccountName,
      getCategorySpentAmount,
      systemMonth, systemYear, setSystemDate,
      resetAllData, getAllData,
      isDataLoading,
      getAccountById
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
