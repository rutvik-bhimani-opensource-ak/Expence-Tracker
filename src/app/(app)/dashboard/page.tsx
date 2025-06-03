
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, DollarSign, TrendingDown, TrendingUp, ListPlus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell  } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  "Food": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Rent/Mortgage": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Transportation": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Utilities": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Healthcare": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Entertainment": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Shopping": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Salary": <TrendingUp className="h-6 w-6 text-[hsl(var(--chart-3))]" />,
  "Investments": <TrendingUp className="h-6 w-6 text-[hsl(var(--chart-3))]" />,
  "Gifts": <DollarSign className="h-6 w-6 text-[hsl(var(--chart-4))]" />, // Using chart-4 (orange) for gifts
  "Other": <BarChart className="h-6 w-6 text-muted-foreground" />,
  "Freelance": <TrendingUp className="h-6 w-6 text-[hsl(var(--chart-3))]" />,
  "Dividends": <TrendingUp className="h-6 w-6 text-[hsl(var(--chart-3))]" />,
  "Side Hustle": <TrendingUp className="h-6 w-6 text-[hsl(var(--chart-3))]" />,
  "Education": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Personal Care": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Subscriptions": <TrendingDown className="h-6 w-6 text-destructive" />,
  "Travel": <TrendingDown className="h-6 w-6 text-destructive" />,
} as const;


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardPage() {
  const { transactions, accounts, budgets, getCategorySpentAmount } = useAppData();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentBalance = accounts.length > 0 ? accounts[0].balance : 0; 

  const recentTransactions = transactions.slice(0, 5);

  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const spendingChartData = Object.entries(spendingByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value); 

  const chartConfig: ChartConfig = spendingChartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard">
        <Button asChild>
          <Link href="/transactions?action=add">
            <ListPlus className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income (This Month)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--chart-3))]">+₹{totalIncome.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Based on all recorded income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses (This Month)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-₹{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on all recorded expenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>Your expenses by category for the current month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {spendingChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={spendingChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                     {spendingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No spending data available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your last 5 transactions.</CardDescription>
          </CardHeader>
          <CardContent>
          <ScrollArea className="h-[350px]">
            {recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                    <TableCell 
                      className={cn(
                        "text-right font-medium",
                        transaction.type === 'income' ? 'text-[hsl(var(--chart-3))]' : 'text-destructive'
                      )}
                    >
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground">No recent transactions.</div>
            )}
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending against your budget goals for this month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgets.length > 0 ? budgets.map(budget => {
            const spent = getCategorySpentAmount(budget.category, currentMonth, currentYear);
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            const remaining = budget.limit - spent;
            return (
              <div key={budget.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{budget.category}</span>
                  <span className="text-sm text-muted-foreground">
                    ₹{spent.toFixed(2)} / ₹{budget.limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className={cn("h-2.5 rounded-full", percentage > 100 ? 'bg-destructive' : 'bg-primary')}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <p className={cn("text-xs mt-1", remaining < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {remaining >= 0 ? `₹${remaining.toFixed(2)} remaining` : `₹${(-remaining).toFixed(2)} over budget`}
                </p>
              </div>
            );
          }) : (
            <p className="text-sm text-muted-foreground">No budgets set yet. <Link href="/budgets" className="text-primary hover:underline">Set up your budgets</Link>.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
