
'use client';

import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AllCategories, ExpenseCategories, IncomeCategories, type Category } from '@/lib/types';
import type { Account } from '@/lib/types';
import { useAppData } from '@/contexts/app-data-context';
import { getCategoryIcon } from '@/lib/category-utils';
import { format, getYear, getMonth } from 'date-fns';
import * as React from 'react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onAddTransaction: () => void;
  data: TData[]; // Full dataset for deriving filter options
}

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: format(new Date(2000, i), 'MMMM'),
}));

const ALL_FILTER_VALUE = "_ALL_";

export function DataTableToolbar<TData>({
  table,
  onAddTransaction,
  data
}: DataTableToolbarProps<TData>) {
  const { accounts, getAccountById, systemYear, systemMonth } = useAppData();
  

  const uniqueYears = React.useMemo(() => {
    const years = new Set<string>();
    (data as unknown as import('@/lib/types').Transaction[]).forEach(t => years.add(getYear(new Date(t.date)).toString()));
    if (!years.has(systemYear.toString())) {
        years.add(systemYear.toString());
    }
    return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
  }, [data, systemYear]);

  const currentDescriptionFilter = table.getColumn('description')?.getFilterValue() as string ?? '';
  const currentCategoryFilter = table.getColumn('category')?.getFilterValue() as string[] ?? [];
  const currentAccountFilter = table.getColumn('accountId')?.getFilterValue() as string[] ?? [];
  const currentTypeFilter = table.getColumn('type')?.getFilterValue() as string[] ?? [];

  // For month/year, we'll need a custom filter function on the `date` column
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');

  const isFiltered = table.getState().columnFilters.length > 0 || selectedMonth !== '' || selectedYear !== '';

  React.useEffect(() => {
    const dateColumn = table.getColumn('date');
    if (!dateColumn) return;

    if (selectedMonth || selectedYear) {
      dateColumn.setFilterValue(() => (dateStr: string) => {
        const date = new Date(dateStr);
        const monthMatch = selectedMonth ? getMonth(date) === parseInt(selectedMonth) : true;
        const yearMatch = selectedYear ? getYear(date) === parseInt(selectedYear) : true;
        return monthMatch && yearMatch;
      });
    } else {
      dateColumn.setFilterValue(undefined); // Clear filter if no month/year selected
    }
  }, [selectedMonth, selectedYear, table]);

  const handleResetFilters = () => {
    table.resetColumnFilters();
    setSelectedMonth('');
    setSelectedYear('');
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
        <Input
          placeholder="Filter by description..."
          value={currentDescriptionFilter}
          onChange={(event) =>
            table.getColumn('description')?.setFilterValue(event.target.value)
          }
          className="h-9 w-full sm:w-[150px] lg:w-[250px]"
        />
        
        <Select
          value={currentCategoryFilter.length > 0 ? currentCategoryFilter[0] : ALL_FILTER_VALUE}
          onValueChange={(value) => {
            if (value === ALL_FILTER_VALUE) {
              table.getColumn('category')?.setFilterValue([]);
            } else {
              table.getColumn('category')?.setFilterValue(value ? [value] : []);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
            {AllCategories.map(cat => {
              const Icon = getCategoryIcon(cat);
              return <SelectItem key={cat} value={cat}><div className="flex items-center"><Icon className="mr-2 h-4 w-4" />{cat}</div></SelectItem>
            })}
          </SelectContent>
        </Select>

        <Select
          value={currentAccountFilter.length > 0 ? currentAccountFilter[0] : ALL_FILTER_VALUE}
          onValueChange={(value) => {
            if (value === ALL_FILTER_VALUE) {
              table.getColumn('accountId')?.setFilterValue([]);
            } else {
              table.getColumn('accountId')?.setFilterValue(value ? [value] : []);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All Accounts</SelectItem>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select
          value={currentTypeFilter.length > 0 ? currentTypeFilter[0] : ALL_FILTER_VALUE}
          onValueChange={(value) => {
            if (value === ALL_FILTER_VALUE) {
              table.getColumn('type')?.setFilterValue([]);
            } else {
              table.getColumn('type')?.setFilterValue(value ? [value] : []);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-[120px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

         <Select 
            value={selectedMonth || ALL_FILTER_VALUE} 
            onValueChange={(value) => {
              if (value === ALL_FILTER_VALUE) {
                setSelectedMonth('');
              } else {
                setSelectedMonth(value);
              }
            }}
          >
          <SelectTrigger className="h-9 w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All Months</SelectItem>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select 
            value={selectedYear || ALL_FILTER_VALUE} 
            onValueChange={(value) => {
                if (value === ALL_FILTER_VALUE) {
                    setSelectedYear('');
                } else {
                    setSelectedYear(value);
                }
            }}
          >
          <SelectTrigger className="h-9 w-full sm:w-[120px]">
            <SelectValue placeholder="Filter by Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All Years</SelectItem>
            {uniqueYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={onAddTransaction} size="sm" className="ml-auto h-9">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Transaction
      </Button>
    </div>
  );
}
