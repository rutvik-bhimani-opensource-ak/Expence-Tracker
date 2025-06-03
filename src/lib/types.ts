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
  | "Other";

export const AllCategories: Category[] = [
  "Food", "Rent/Mortgage", "Transportation", "Utilities", "Healthcare",
  "Entertainment", "Shopping", "Salary", "Investments", "Gifts", "Freelance",
  "Dividends", "Side Hustle", "Education", "Personal Care", "Subscriptions", "Travel", "Other"
];

export const ExpenseCategories: Category[] = [
  "Food", "Rent/Mortgage", "Transportation", "Utilities", "Healthcare",
  "Entertainment", "Shopping", "Gifts", "Education", "Personal Care", "Subscriptions", "Travel", "Other"
];

export const IncomeCategories: Category[] = [
  "Salary", "Investments", "Freelance", "Dividends", "Side Hustle", "Gifts", "Other"
];

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number; // Positive for income, negative for expenses
  category: Category;
  type: 'income' | 'expense';
  vendor?: string;
}

export interface BudgetGoal {
  id: string;
  category: Category;
  limit: number; // The budgeted amount for the month
  spent: number; // How much has been spent in this category this month
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}
