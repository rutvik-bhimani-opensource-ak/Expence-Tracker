
'use client';
import React, { useState, useMemo } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, DollarSign, TrendingDown, TrendingUp, ListPlus, Landmark, Wallet, Percent, PiggyBank, Target as TargetIcon, Activity } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend as RechartsLegend  } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getCategoryIcon } from '@/lib/category-utils';
import type { Category } from '@/lib/types';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface InteractiveLegendProps {
  data: Array<{ name: Category; value: number; color: string }>; // Changed from payload to data
  onToggle: (categoryName: string) => void;
  activeCategories: Record<string, boolean>;
  chartConfig: ChartConfig;
}

const InteractiveLegend: React.FC<InteractiveLegendProps> = ({ data, onToggle, activeCategories, chartConfig }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-3 text-xs">
      {data.map((entry) => { // Iterate over the full data
        const categoryName = entry.name; // Use entry.name from our data
        const isActive = activeCategories[categoryName];
        const Icon = chartConfig[categoryName]?.icon || getCategoryIcon(categoryName);

        return (
          <div
            key={`legend-${categoryName}`}
            onClick={() => onToggle(categoryName)}
            className={cn(
              "flex items-center cursor-pointer p-1 rounded-md hover:bg-muted/50",
              !isActive && "opacity-50"
            )}
          >
            <span
              className="w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: entry.color }} // entry.color is from our data
            />
            {Icon && <Icon className={cn("w-3.5 h-3.5 mr-1", isActive ? "text-foreground" : "text-muted-foreground")} />}
            <span className={cn("select-none", isActive ? "text-foreground" : "text-muted-foreground line-through")}>
              {categoryName}
            </span>
          </div>
        );
      })}
    </div>
  );
};


export default function DashboardPage() {
  const { transactions, accounts, budgets, systemMonth, systemYear, getAccountById } = useAppData();

  const currentMonthName = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  const primaryAccount = getAccountById('primary');
  const cashAccount = getAccountById('cash');

  const totalIncome = useMemo(() => transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((sum, t) => sum + t.amount, 0), [transactions, systemMonth, systemYear]);

  const totalExpenses = useMemo(() => transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((sum, t) => sum + t.amount, 0), [transactions, systemMonth, systemYear]);
  
  const recentTransactions = useMemo(() => [...transactions]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5), [transactions]);

  // Financial Health Indicators
  const savingsRate = useMemo(() => {
    if (totalIncome === 0) return 0;
    return ((totalIncome - totalExpenses) / totalIncome) * 100;
  }, [totalIncome, totalExpenses]);

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);


  const spendingByCategoryRaw = useMemo(() => transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate.getMonth() === systemMonth && tDate.getFullYear() === systemYear;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>), [transactions, systemMonth, systemYear]);

  const spendingChartData = useMemo(() => Object.entries(spendingByCategoryRaw)
    .map(([name, value], index) => ({ 
      name: name as Category, 
      value, 
      color: CHART_COLORS[index % CHART_COLORS.length] 
    }))
    .sort((a,b) => b.value - a.value), [spendingByCategoryRaw]);

  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const initialActive: Record<string, boolean> = {};
    spendingChartData.forEach(item => {
      initialActive[item.name] = activeCategories[item.name] ?? true;
    });
    setActiveCategories(initialActive);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spendingChartData]);

  const handleLegendToggle = (categoryName: string) => {
    setActiveCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const filteredPieData = useMemo(() => 
    spendingChartData.filter(item => activeCategories[item.name]),
  [spendingChartData, activeCategories]);

  const chartConfig = useMemo((): ChartConfig => spendingChartData.reduce((acc, item) => {
    const Icon = getCategoryIcon(item.name);
    acc[item.name] = {
      label: item.name,
      color: item.color,
      icon: Icon,
    };
    return acc;
  }, {} as ChartConfig), [spendingChartData]);
  
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{primaryAccount?.name || 'Main Account'}</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(primaryAccount?.balance || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{cashAccount?.name || 'Cash Account'}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(cashAccount?.balance || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Cash on hand</p>
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

       <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5"/>Financial Health Indicators</CardTitle>
            <CardDescription>Key metrics for your financial well-being.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="border rounded-lg p-4 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <div className="text-2xl font-bold">₹{netWorth.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Sum of all account balances</p>
                </div>
            </div>
            <div className="border rounded-lg p-4 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Savings Rate ({currentMonthName})</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <div className={cn("text-2xl font-bold", savingsRate < 0 ? 'text-destructive' : 'text-[hsl(var(--chart-3))]')}>{savingsRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Healthy range: 20-30%</p>
                </div>
            </div>
             <div className="border rounded-lg p-4 flex flex-col justify-between bg-muted/40">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Investment &amp; FI Ratio</CardTitle>
                    <TargetIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Future Enhancement: Track investment growth and progress towards Financial Independence.</p>
                </div>
            </div>
             <div className="border rounded-lg p-4 flex flex-col justify-between bg-muted/40">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Debt-to-Income Ratio</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Future Enhancement: Track total debt vs. income after adding loan/debt tracking features.</p>
                </div>
            </div>
        </CardContent>
       </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
            <CardDescription>Your expenses by category for {currentMonthName}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {spendingChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full" chartHeight={326}>
              <ResponsiveContainer>
                <RechartsPieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
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
                  <Pie data={filteredPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                     {filteredPieData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsLegend 
                    content={
                        <InteractiveLegend 
                            data={spendingChartData} 
                            onToggle={handleLegendToggle} 
                            activeCategories={activeCategories} 
                            chartConfig={chartConfig} 
                        />
                    } 
                    verticalAlign="bottom"
                  />
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
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
                  const CategoryIcon = getCategoryIcon(transaction.category);
                  const accountUsed = getAccountById(transaction.accountId);
                  const AccountIcon = transaction.accountId === 'primary' ? Landmark : Wallet;
                  return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit">
                           <CategoryIcon className="mr-1.5 h-3.5 w-3.5" />
                           {transaction.category}
                        </Badge>
                    </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit text-xs">
                           <AccountIcon className="mr-1.5 h-3 w-3" />
                           {accountUsed?.name || transaction.accountId}
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
