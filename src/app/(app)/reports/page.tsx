
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { useMemo } from 'react';
import { format, getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, BarChart as BarChartIcon } from 'lucide-react'; // BarChartIcon for empty state

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportsPage() {
  const { transactions, systemMonth, systemYear } = useAppData();

  const currentSystemDateFormatted = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  // Monthly Income/Expense for the System Year
  const monthlyIncomeExpenseDataSystemYear = useMemo(() => {
    const dataByMonth: Record<string, { month: string; monthNumeric: number; income: number; expenses: number }> = {};
    const targetYearTransactions = transactions.filter(t => getYear(new Date(t.date)) === systemYear);

    for (let i = 0; i < 12; i++) { // Ensure all months of the system year are present
      const monthName = format(new Date(systemYear, i), 'MMM');
      dataByMonth[monthName] = { month: monthName, monthNumeric: i, income: 0, expenses: 0 };
    }

    targetYearTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthName = format(date, 'MMM');
      if (dataByMonth[monthName]) {
        if (t.type === 'income') {
          dataByMonth[monthName].income += t.amount;
        } else {
          dataByMonth[monthName].expenses += t.amount;
        }
      }
    });
    return Object.values(dataByMonth).sort((a,b) => a.monthNumeric - b.monthNumeric);
  }, [transactions, systemYear]);
  
  const incomeExpenseChartConfig: ChartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-3))" }, 
    expenses: { label: "Expenses", color: "hsl(var(--destructive))" }, 
  };

  // Category Spending for the System Month
  const categorySpendingDataSystemMonth = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && getMonth(tDate) === systemMonth && getYear(tDate) === systemYear;
      })
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [transactions, systemMonth, systemYear]);

  const categoryChartConfig: ChartConfig = categorySpendingDataSystemMonth.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);


  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics">
         <span className="text-sm text-muted-foreground">Displaying reports based on: {currentSystemDateFormatted}</span>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs. Expense ({systemYear})</CardTitle>
            <CardDescription>Comparison of your income and expenses for each month of {systemYear}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
          {monthlyIncomeExpenseDataSystemYear.some(d => d.income > 0 || d.expenses > 0) ? (
            <ChartContainer config={incomeExpenseChartConfig} className="w-full h-full">
              <ResponsiveContainer>
                <RechartsBarChart data={monthlyIncomeExpenseDataSystemYear}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                        formatter={(value, name) => `₹${Number(value).toFixed(2)}`} 
                    />} 
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 mb-2"/>
                    No income/expense data for {systemYear}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category ({currentSystemDateFormatted})</CardTitle>
            <CardDescription>Breakdown of your total expenses by category for {currentSystemDateFormatted}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
           {categorySpendingDataSystemMonth.length > 0 ? (
            <ChartContainer config={categoryChartConfig} className="w-full h-full">
               <ResponsiveContainer>
                <RechartsPieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                                hideLabel 
                                formatter={(value, name) => `${name}: ₹${Number(value).toFixed(2)}`} 
                            />}
                   />
                  <Pie data={categorySpendingDataSystemMonth} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                    {categorySpendingDataSystemMonth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" className="text-xs"/>} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
               <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <BarChartIcon className="mx-auto h-12 w-12 mb-2"/>
                    No spending data available for {currentSystemDateFormatted}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
