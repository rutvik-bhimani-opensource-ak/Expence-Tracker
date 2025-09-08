
export type Category =
  | "Food"
  | "Rent/Mortgage"
  | "Transportation"
  | "Utilities"
  | "Healthcare"
  | "Entertainment"
  | "Shopping"
  | "Salary"
  | "Investments"
  | "Gifts"
  | "Freelance"
  | "Dividends"
  | "Side Hustle"
  | "Education"
  | "Personal Care"
  | "Subscriptions"
  | "Travel"
  | "Air Fresheners"
  | "FD Returns"
  | "Investment Returns"
  | "Other";

export const AllCategories: Category[] = [
  "Food", "Rent/Mortgage", "Transportation", "Utilities", "Healthcare",
  "Entertainment", "Shopping", "Salary", "Investments", "Gifts", "Freelance",
  "Dividends", "Side Hustle", "Education", "Personal Care", "Subscriptions", "Travel", "Air Fresheners",
  "FD Returns", "Investment Returns", "Other"
];

export const ExpenseCategories: Category[] = [
  "Food", "Rent/Mortgage", "Transportation", "Utilities", "Healthcare",
  "Entertainment", "Shopping", "Gifts", "Education", "Personal Care", "Subscriptions", "Travel", "Air Fresheners",
  "Investments", "Other"
];

export const IncomeCategories: Category[] = [
  "Salary", "Freelance", "Dividends", "Side Hustle", "Gifts",
  "FD Returns", "Investment Returns", "Other"
];

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number;
  category: Category;
  type: 'income' | 'expense';
  vendor?: string;
  accountId: 'primary' | 'cash'; // Identifies the source/destination account
}

export interface BudgetGoal {
  id: string;
  category: Category;
  limit: number; // The budgeted amount for the month
  spent: number; // How much has been spent in this category this month
}

export interface Account {
  id: 'primary' | 'cash'; // Fixed IDs for Main and Cash accounts
  name: string;
  balance: number;
}
