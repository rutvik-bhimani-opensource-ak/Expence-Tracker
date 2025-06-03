
'use client';
import React from 'react'; // Added React import
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
import { format } from 'date-fns';
import { getCategoryIcon } from '@/lib/category-utils';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardPage() {
  const { transactions, accounts, budgets, getCategorySpentAmount, systemMonth, systemYear } = useAppData();

  const currentMonthName = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  const totalIncome = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentBalance = accounts.length > 0 ? accounts[0].balance : 0; 

  const recentTransactions = [...transactions] // Create a copy before sorting
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);


  const spendingByCategory = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const spendingChartData = Object.entries(spendingByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value); 

  const chartConfig: ChartConfig = spendingChartData.reduce((acc, item, index) => {
    const Icon = getCategoryIcon(item.name as any); // any for now, should be Category type
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
      icon: Icon,
    };
    return acc;
  }, {} as ChartConfig);
  
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard">
        <div className="flex flex-col items-end sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">Displaying data for: {currentMonthName}</span>
            <Button asChild>
            <Link href="/transactions?action=add">
                <ListPlus className="mr-2 h-4 w-4" /> Add Transaction
            </Link>
            </Button>
        </div>
      </PageHeader>
       <p className="text-sm text-muted-foreground sm:hidden -mt-4 mb-4">Displaying data for: {currentMonthName}</p>

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
            <CardTitle className="text-sm font-medium">Income ({currentMonthName})</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--chart-3))]">+₹{totalIncome.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Income for {currentMonthName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses ({currentMonthName})</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-₹{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Expenses for {currentMonthName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>Your expenses by category for {currentMonthName}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {spendingChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                        hideLabel 
                        formatter={(value, name, props) => (
                          <div className="flex items-center">
                            {chartConfig[props.name as string]?.icon && React.createElement(chartConfig[props.name as string].icon as any, { className: "mr-1.5 h-4 w-4 text-muted-foreground"})}
                            <span>{props.name}: ₹{Number(value).toFixed(2)}</span>
                          </div>
                        )}
                    />} 
                  />
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
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                    <BarChart className="mx-auto h-12 w-12 mb-2"/>
                    No spending data available for {currentMonthName}.
                </div>
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your last 5 transactions (all time).</CardDescription>
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
                {recentTransactions.map((transaction) => {
                  const CategoryIcon = getCategoryIcon(transaction.category);
                  return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit">
                           <CategoryIcon className="mr-1.5 h-3.5 w-3.5" />
                           {transaction.category}
                        </Badge>
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right font-medium",
                        transaction.type === 'income' ? 'text-[hsl(var(--chart-3))]' : 'text-destructive'
                      )}
                    >
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            ) : (
               <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <ListPlus className="mx-auto h-12 w-12 mb-2"/>
                    No recent transactions.
                </div>
               </div>
            )}
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>Track your spending against budget goals for {currentMonthName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgets.length > 0 ? budgets.map(budget => {
            const CategoryIcon = getCategoryIcon(budget.category);
            const spent = budget.spent;
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            const remaining = budget.limit - spent;
            return (
              <div key={budget.id}>
                <div className="flex justify-between mb-1 items-center">
                  <div className="flex items-center text-sm font-medium">
                    <CategoryIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {budget.category}
                  </div>
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
            <p className="text-sm text-muted-foreground">No budgets set for {currentMonthName}. <Link href="/budgets" className="text-primary hover:underline">Set up your budgets</Link>.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
