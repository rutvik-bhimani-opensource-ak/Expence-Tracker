
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from './data-table/data-table-column-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Landmark, Wallet } from 'lucide-react';
import type { Transaction, Account } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/category-utils';
import type { AppDataContextType } from '@/contexts/app-data-context'; // For deleteTransaction

export const getColumns = (
  deleteTransaction: AppDataContextType['deleteTransaction'],
  getAccountById: AppDataContextType['getAccountById'],
  // handleEdit: (transaction: Transaction) => void // Placeholder for edit
): ColumnDef<Transaction>[] => [
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = row.getValue('date') as string;
      return <div className="min-w-[100px]">{format(new Date(date), 'MMM dd, yyyy')}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <div className="font-medium min-w-[150px] truncate max-w-[250px]">{row.getValue('description')}</div>,
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => {
      const category = row.getValue('category') as Transaction['category'];
      const CategoryIcon = getCategoryIcon(category);
      return (
        <Badge variant="outline" className="flex items-center w-fit min-w-[100px]">
          <CategoryIcon className="mr-1.5 h-3.5 w-3.5" />
          {category}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
  },
  {
    accessorKey: 'accountId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
    cell: ({ row }) => {
      const accountId = row.getValue('accountId') as Transaction['accountId'];
      const accountUsed = getAccountById(accountId);
      const AccountIcon = accountId === 'primary' ? Landmark : Wallet;
      return (
        <Badge variant="outline" className="flex items-center w-fit text-xs min-w-[100px]">
          <AccountIcon className="mr-1.5 h-3 w-3" />
          {accountUsed?.name || accountId}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('type') as Transaction['type'];
      return (
        <Badge
          variant={type === 'income' ? 'default' : 'destructive'}
          className={cn(
            'font-semibold min-w-[70px] justify-center',
            type === 'income'
              ? 'bg-[hsl(var(--chart-3))] text-primary-foreground border-[hsl(var(--chart-3))]'
              : 'bg-destructive text-destructive-foreground border-destructive'
          )}
        >
          {type}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const type = row.getValue('type') as Transaction['type'];
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
      return (
        <div
          className={cn(
            'text-right font-medium min-w-[100px]',
            type === 'income' ? 'text-[hsl(var(--chart-3))]' : 'text-destructive'
          )}
        >
          {type === 'income' ? '+' : '-'}
          {formatted}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="text-right">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this transaction: "{transaction.description}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTransaction(transaction.id)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* 
          // Placeholder for Edit Action
          <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="ml-2 hover:bg-accent">
            <Edit className="h-4 w-4" />
          </Button> 
          */}
        </div>
      );
    },
  },
];
