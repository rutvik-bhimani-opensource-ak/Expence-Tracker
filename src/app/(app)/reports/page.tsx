
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { useMemo, useState, useEffect } from 'react';
import { format, getYear, getMonth } from 'date-fns';
import { TrendingUp, BarChart as BarChartIcon, CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '@/lib/category-utils';
import type { Category } from '@/lib/types';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(2000, i), 'MMMM'),
}));

export default function ReportsPage() {
  const { transactions, systemMonth, systemYear } = useAppData();

  const [selectedMonth, setSelectedMonth] = useState<number>(systemMonth);
  const [selectedYear, setSelectedYear] = useState<number>(systemYear);
  const [inputYear, setInputYear] = useState<string>(systemYear.toString());

  useEffect(() => {
    setSelectedMonth(systemMonth);
    setSelectedYear(systemYear);
    setInputYear(systemYear.toString());
  }, [systemMonth, systemYear]);
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputYear(e.target.value);
  };

  const handleSetReportDate = () => {
    const yearNum = parseInt(inputYear);
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      setSelectedYear(yearNum);
    } else {
      // Optionally, show a toast or error for invalid year
      setInputYear(selectedYear.toString()); // Reset to valid year
    }
  };

  const selectedPeriodFormatted = format(new Date(selectedYear, selectedMonth), 'MMMM yyyy');

  const monthlyIncomeExpenseData = useMemo(() => {
    const dataByMonth: Record<string, { month: string; monthNumeric: number; income: number; expenses: number }> = {};
    const targetYearTransactions = transactions.filter(t => getYear(new Date(t.date)) === selectedYear);

    for (let i = 0; i < 12; i++) {
      const monthName = format(new Date(selectedYear, i), 'MMM');
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
  }, [transactions, selectedYear]);
  
  const incomeExpenseChartConfig: ChartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-3))" }, 
    expenses: { label: "Expenses", color: "hsl(var(--destructive))" }, 
  };

  const categorySpendingData = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && getMonth(tDate) === selectedMonth && getYear(tDate) === selectedYear;
      })
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [transactions, selectedMonth, selectedYear]);

  const categoryChartConfig: ChartConfig = categorySpendingData.reduce((acc, item, index) => {
    const Icon = getCategoryIcon(item.name as Category);
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
      icon: Icon,
    };
    return acc;
  }, {} as ChartConfig);


  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics">
         <span className="text-sm text-muted-foreground">Select month and year to generate reports.</span>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>Choose the month and year for the reports below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="report-month">Month</Label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger id="report-month" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="report-year">Year</Label>
            <Input 
              id="report-year" 
              type="number" 
              value={inputYear}
              onChange={handleYearChange}
              placeholder="YYYY"
              className="w-full sm:w-[100px]"
            />
          </div>
          <Button onClick={handleSetReportDate} className="w-full sm:w-auto">
            <CalendarDays className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs. Expense ({selectedYear})</CardTitle>
            <CardDescription>Comparison of your income and expenses for each month of {selectedYear}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
          {monthlyIncomeExpenseData.some(d => d.income > 0 || d.expenses > 0) ? (
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
              <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 mb-2"/>
                    No income/expense data for {selectedYear}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category ({selectedPeriodFormatted})</CardTitle>
            <CardDescription>Breakdown of your total expenses by category for {selectedPeriodFormatted}.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
           {categorySpendingData.length > 0 ? (
            <ChartContainer config={categoryChartConfig} className="w-full h-full">
               <ResponsiveContainer>
                <RechartsPieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                                hideLabel 
                                formatter={(value, name, props) => (
                                  <div className="flex items-center">
                                    {categoryChartConfig[props.name as string]?.icon && React.createElement(categoryChartConfig[props.name as string].icon as any, { className: "mr-1.5 h-4 w-4 text-muted-foreground"})}
                                    <span>{props.name}: ₹{Number(value).toFixed(2)}</span>
                                  </div>
                                )}
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
               <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <BarChartIcon className="mx-auto h-12 w-12 mb-2"/>
                    No spending data available for {selectedPeriodFormatted}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
