
'use client';
import { useState } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';


export default function TransactionsPage() {
  const { transactions, deleteTransaction } = useAppData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);


  // const handleEdit = (transaction: Transaction) => {
  //   setEditingTransaction(transaction);
  //   setIsAddDialogOpen(true);
  // };
  
  const handleDelete = (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(transactionId);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Transactions">
        <Button onClick={() => { /*setEditingTransaction(undefined);*/ setIsAddDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </PageHeader>

      <AddTransactionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        // defaultTransaction={editingTransaction}
      />
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell><Badge variant="outline">{transaction.category}</Badge></TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "font-semibold",
                      transaction.type === 'income' ? 'text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]' : 'text-destructive border-destructive'
                    )}
                  >
                    {transaction.type}
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
                <TableCell className="text-right">
                  {/* <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="mr-2">
                    <Edit className="h-4 w-4" />
                  </Button> */}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No transactions yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
