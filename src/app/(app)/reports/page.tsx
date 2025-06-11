
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, TooltipProps } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { 
  format, getYear, getMonth, startOfMonth, endOfMonth, isWithinInterval, parseISO,
  startOfDay, endOfDay, subDays, subMonths, startOfYear, endOfYear, subYears, 
  eachMonthOfInterval,
  addYears
} from 'date-fns';
import { TrendingUp, BarChart as BarChartIcon, CalendarDays, Info, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '@/lib/category-utils';
import type { Category, Transaction } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type Preset = {
  label: string;
  getRange: () => DateRange;
};

const presets: Preset[] = [
  { label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Yesterday", getRange: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "This Year", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: "Last Year", getRange: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
];


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
    if (dateRange?.from) { 
        return format(dateRange.from, 'PPP');
    }
    return 'No date range selected';
  }, [dateRange]);

  const filteredTransactionsByDateRange = useMemo(() => {
    if (!dateRange?.from) return []; 
    
    const adjustedToDate = dateRange.to 
        ? new Date(new Date(dateRange.to).setHours(23, 59, 59, 999)) 
        : new Date(new Date(dateRange.from).setHours(23, 59, 59, 999)); 

    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: dateRange.from as Date, end: adjustedToDate });
    });
  }, [transactions, dateRange]);

  // Data for Monthly Income vs Expense for System Year
  const monthlyIncomeExpenseDataForSystemYear = useMemo(() => {
    const yearTransactions = transactions.filter(t => getYear(parseISO(t.date)) === systemYear);
    const monthsInYear = eachMonthOfInterval({
      start: startOfYear(new Date(systemYear, 0, 1)),
      end: endOfYear(new Date(systemYear, 0, 1))
    });

    return monthsInYear.map(monthDate => {
      const month = getMonth(monthDate);
      let income = 0;
      let expenses = 0;
      yearTransactions.forEach(t => {
        if (getMonth(parseISO(t.date)) === month) {
          if (t.type === 'income') income += t.amount;
          else expenses += t.amount;
        }
      });
      return { monthName: format(monthDate, 'MMM'), income, expenses };
    });
  }, [transactions, systemYear]);
  
  const monthlyIncomeExpenseChartConfig: ChartConfig = {
    income: { label: "Income", color: "hsl(var(--chart-3))" }, 
    expenses: { label: "Expenses", color: "hsl(var(--destructive))" }, 
  };


  const categorySpendingData = useMemo(() => {
    const spending: Record<string, number> = {};
    filteredTransactionsByDateRange
      .filter(t => t.type === 'expense')
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return Object.entries(spending)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredTransactionsByDateRange]);
  
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

  // Data for Current vs Previous Year Comparison (using dateRange)
  const comparisonChartData = useMemo(() => {
    if (!dateRange?.from || !dateRange.to) return [];

    const currentRangeStart = dateRange.from;
    const currentRangeEnd = new Date(new Date(dateRange.to).setHours(23, 59, 59, 999));
    
    const prevRangeStart = subYears(currentRangeStart, 1);
    const prevRangeEnd = subYears(currentRangeEnd, 1);

    let currentIncome = 0;
    let currentExpenses = 0;
    let prevIncome = 0;
    let prevExpenses = 0;

    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      if (isWithinInterval(tDate, { start: currentRangeStart, end: currentRangeEnd })) {
        if (t.type === 'income') currentIncome += t.amount;
        else currentExpenses += t.amount;
      } else if (isWithinInterval(tDate, { start: prevRangeStart, end: prevRangeEnd })) {
        if (t.type === 'income') prevIncome += t.amount;
        else prevExpenses += t.amount;
      }
    });
    
    return [
      { type: 'Income', current: currentIncome, previous: prevIncome },
      { type: 'Expenses', current: currentExpenses, previous: prevExpenses },
    ];
  }, [transactions, dateRange]);

  const comparisonChartConfig: ChartConfig = {
    current: { label: "Current Period", color: "hsl(var(--chart-1))" },
    previous: { label: "Previous Period", color: "hsl(var(--chart-2))" },
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics">
         <span className="text-sm text-muted-foreground">Analyze your financial trends.</span>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs. Expense ({systemYear})</CardTitle>
          <CardDescription>Overview of income and expenses for each month of {systemYear}.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
        {monthlyIncomeExpenseDataForSystemYear.some(d => d.income > 0 || d.expenses > 0) ? (
          <ChartContainer config={monthlyIncomeExpenseChartConfig} className="w-full h-full" chartHeight={376}>
            <ResponsiveContainer>
              <RechartsBarChart data={monthlyIncomeExpenseDataForSystemYear}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="monthName" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    formatter={(value, name, props) => (
                        <div className="flex items-center">
                        <span>{props.payload?.monthName} - {name}: ₹{Number(value).toFixed(2)}</span>
                        </div>
                    )}
                  />} 
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" name="Income" fill="hsl(var(--chart-3))" radius={4} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={4} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
               <div className="text-center text-muted-foreground">
                  <LineChart className="mx-auto h-12 w-12 mb-2"/>
                  No income or expense data for {systemYear}.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Date Range Reports</CardTitle>
          <CardDescription>Choose a date range for the reports below. Currently showing: <strong>{selectedPeriodFormatted}</strong></CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
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
            </div>
            <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
                <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(preset.getRange())}
                    className={cn(
                        "text-muted-foreground hover:text-primary hover:bg-primary/10",
                        dateRange?.from && dateRange.to &&
                        format(dateRange.from, 'yyyy-MM-dd') === format(preset.getRange().from as Date, 'yyyy-MM-dd') &&
                        format(dateRange.to, 'yyyy-MM-dd') === format(preset.getRange().to as Date, 'yyyy-MM-dd') &&
                        "text-primary bg-primary/10 border border-primary/30"
                    )}
                >
                    {preset.label}
                </Button>
            ))}
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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
        
        <Card>
          <CardHeader>
            <CardTitle>Current vs. Previous Year Comparison</CardTitle>
            <CardDescription>Income & Expenses for {selectedPeriodFormatted} vs. same period last year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {comparisonChartData.some(d => d.current > 0 || d.previous > 0) ? (
              <ChartContainer config={comparisonChartConfig} className="w-full h-full" chartHeight={376}>
                <ResponsiveContainer>
                  <RechartsBarChart data={comparisonChartData} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} width={80}/>
                    <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                    <ChartTooltip 
                        content={<ChartTooltipContent 
                            indicator="dot" 
                            formatter={(value, name, props) => (
                              <div className="flex items-center">
                                <span>{props.payload?.type} - {name}: ₹{Number(value).toFixed(2)}</span>
                              </div>
                            )}
                        />} 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="current" name="Current Period" fill="hsl(var(--chart-1))" radius={4} />
                    <Bar dataKey="previous" name="Previous Period" fill="hsl(var(--chart-2))" radius={4} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-2"/>
                  No data for comparison or date range not fully selected.
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
            <li>Income by Category chart (based on selected date range).</li>
            <li>Net Savings/Deficit Over Time line chart (monthly, for selected date range or year).</li>
            <li>Clickable legends for pie charts to toggle slice visibility.</li>
          </CardContent>
        </Card>
    </div>
  );
}

