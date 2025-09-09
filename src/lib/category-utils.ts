
// src/lib/category-utils.ts
import type { Category } from '@/lib/types';
import {
  Utensils, Home, Car, Lightbulb, Stethoscope, Ticket, ShoppingBag, Landmark,
  TrendingUp, Gift, Laptop, PieChart as PieChartIconLucide, Zap, GraduationCap, User,
  Repeat, Plane, HelpCircle, Wind, LineChart, CandlestickChart, CreditCard,
 type LucideIcon
} from 'lucide-react';

export const categoryIconsMapping: Record<Category, LucideIcon> = {
  "Food": Utensils,
  "Rent/Mortgage": Home,
  "Transportation": Car,
  "Utilities": Lightbulb,
  "Healthcare": Stethoscope,
  "Entertainment": Ticket,
  "Shopping": ShoppingBag,
  "Salary": Landmark,
  "Investments": TrendingUp,
  "Gifts": Gift,
  "Freelance": Laptop,
  "Dividends": PieChartIconLucide,
  "Side Hustle": Zap,
  "Education": GraduationCap,
  "Personal Care": User,
  "Subscriptions": Repeat,
  "Travel": Plane,
  "Air Fresheners": Wind,
  "FD Returns": LineChart,
  "Investment Returns": CandlestickChart,
  "Credit Card Payment": CreditCard,
  "Other": HelpCircle,
};

export const getCategoryIcon = (category: Category): LucideIcon => {
  return categoryIconsMapping[category] || HelpCircle;
};
