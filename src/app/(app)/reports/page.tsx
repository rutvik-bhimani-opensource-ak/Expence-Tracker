
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, TooltipProps } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { format, getYear, getMonth, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { TrendingUp, BarChart as BarChartIcon, CalendarDays, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '@/lib/category-utils';
import type { Category, Transaction } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportsPage() {
  const { transactions, systemMonth, systemYear } = useAppData();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date(systemYear, systemMonth)),
    to: endOfMonth(new Date(systemYear, systemMonth)),
  });

  useEffect(() => {
    setDateRange({
        from: startOfMonth(new Date(systemYear, systemMonth)),
        to: endOfMonth(new Date(systemYear, systemMonth)),
    });
  }, [systemMonth, systemYear]);
  
  const selectedPeriodFormatted = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
        return format(dateRange.from, 'PPP');
      }
      return `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
    }
    return 'No date range selected';
  }, [dateRange]);

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const adjustedToDate = new Date(dateRange.to);
    adjustedToDate.setHours(23, 59, 59, 999); // Ensure 'to' date includes the whole day

    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: dateRange.from as Date, end: adjustedToDate });
    });
  }, [transactions, dateRange]);

  const rangeIncomeExpenseData = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });
    return [
      { name: 'Income', value: income },
      { name: 'Expenses', value: expenses },
    ];
  }, [filteredTransactions]);
  
  const incomeExpenseChartConfig: ChartConfig = {
    value: { label: "Amount" }, // Generic label
    Income: { label: "Income", color: "hsl(var(--chart-3))" }, 
    Expenses: { label: "Expenses", color: "hsl(var(--destructive))" }, 
  };

  const categorySpendingData = useMemo(() => {
    const spending: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredTransactions]);
  
  const totalSpendingForPeriod = useMemo(() => {
    return categorySpendingData.reduce((sum, item) => sum + item.value, 0);
  }, [categorySpendingData]);

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
         <span className="text-sm text-muted-foreground">Select a date range to generate reports.</span>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>Choose the date range for the reports below. Currently showing: <strong>{selectedPeriodFormatted}</strong></CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs. Expense ({selectedPeriodFormatted})</CardTitle>
            <CardDescription>Total income and expenses for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
          {rangeIncomeExpenseData.some(d => d.value > 0) ? (
            <ChartContainer config={incomeExpenseChartConfig} className="w-full h-full" chartHeight={376}>
              <ResponsiveContainer>
                <RechartsBarChart data={rangeIncomeExpenseData} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                  <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent 
                        indicator="dot"
                        formatter={(value, name) => (
                          <div className="flex items-center">
                            <span>{name}: ₹{Number(value).toFixed(2)}</span>
                          </div>
                        )} 
                    />} 
                  />
                  <Bar dataKey="value" name="Amount" radius={4}>
                     {rangeIncomeExpenseData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.name === 'Income' ? "hsl(var(--chart-3))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                 <div className="text-center text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12 mb-2"/>
                    No income or expense data for {selectedPeriodFormatted}.
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
            <ChartContainer config={categoryChartConfig} className="w-full h-full" chartHeight={376}>
               <ResponsiveContainer>
                <RechartsPieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                                hideLabel 
                                formatter={(value, name, props) => {
                                  const percentage = totalSpendingForPeriod > 0 ? (Number(value) / totalSpendingForPeriod) * 100 : 0;
                                  return (
                                    <div className="flex items-center">
                                      {categoryChartConfig[props.name as string]?.icon && React.createElement(categoryChartConfig[props.name as string].icon as any, { className: "mr-1.5 h-4 w-4 text-muted-foreground"})}
                                      <span>{props.name}: ₹{Number(value).toFixed(2)} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                  );
                                }}
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
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Future Enhancements</CardTitle>
            <CardDescription>Upcoming features for this reports page:</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Income by Category chart.</li>
            <li>Net Savings/Deficit Over Time chart.</li>
            <li>Clickable legends for pie charts to toggle slice visibility.</li>
          </CardContent>
        </Card>
    </div>
  );
}

