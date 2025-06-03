
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { useMemo } from 'react';
import { format } from 'date-fns';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportsPage() {
  const { transactions } = useAppData();

  const monthlyIncomeExpenseData = useMemo(() => {
    const dataByMonth: Record<string, { month: string; income: number; expenses: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = format(date, 'MMM yyyy');
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { month: format(date, 'MMM'), income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        dataByMonth[monthYear].income += t.amount;
      } else {
        dataByMonth[monthYear].expenses += t.amount;
      }
    });
    return Object.values(dataByMonth).sort((a,b) => new Date(`01 ${a.month} ${new Date().getFullYear()}`) > new Date(`01 ${b.month} ${new Date().getFullYear()}`) ? 1 : -1); 
  }, [transactions]);
  
  const incomeExpenseChartConfig: ChartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-3))" }, 
    expenses: { label: "Expenses", color: "hsl(var(--destructive))" }, 
  };

  const categorySpendingData = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [transactions]);

  const categoryChartConfig: ChartConfig = categorySpendingData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);


  return (
    <div className="w-full space-y-6">
      <PageHeader title="Reports & Analytics" />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs. Expense</CardTitle>
            <CardDescription>Comparison of your income and expenses over recent months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
          {monthlyIncomeExpenseData.length > 0 ? (
            <ChartContainer config={incomeExpenseChartConfig} className="w-full h-full">
              <ResponsiveContainer>
                <RechartsBarChart data={monthlyIncomeExpenseData}>
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
              <div className="flex items-center justify-center h-full text-muted-foreground">No data for income/expense chart.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category (All Time)</CardTitle>
            <CardDescription>Breakdown of your total expenses by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
           {categorySpendingData.length > 0 ? (
            <ChartContainer config={categoryChartConfig} className="w-full h-full">
               <ResponsiveContainer>
                <RechartsPieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                                hideLabel 
                                formatter={(value, name) => `${name}: ₹${Number(value).toFixed(2)}`} 
                            />}
                   />
                  <Pie data={categorySpendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%">
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" className="text-xs"/>} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No spending data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
