
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function TransactionsPage() {
  const { transactions, deleteTransaction } = useAppData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined); // Edit functionality can be added later


  // const handleEdit = (transaction: Transaction) => {
  //   setEditingTransaction(transaction);
  //   setIsAddDialogOpen(true);
  // };
  
  const handleDeleteConfirmation = (transactionId: string) => {
    deleteTransaction(transactionId);
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
        // defaultTransaction={editingTransaction} // Pass for editing
      />
      
      <ScrollArea className="h-[calc(100vh-220px)]"> {/* Adjusted height slightly */}
        <Table>
          <TableCaption>{transactions.length > 0 ? 'A list of your recent transactions.' : 'No transactions yet. Click "Add Transaction" to get started.'}</TableCaption>
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
                    variant={transaction.type === 'income' ? 'default' : 'destructive'}
                    className={cn(
                        "font-semibold",
                        transaction.type === 'income' ? 'bg-[hsl(var(--chart-3))] text-primary-foreground border-[hsl(var(--chart-3))]' : 'bg-destructive text-destructive-foreground border-destructive'
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
                  {/* Edit button can be re-enabled when edit functionality is complete */}
                  {/* <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="mr-2 hover:bg-accent">
                    <Edit className="h-4 w-4" />
                  </Button> */}
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
                          This action cannot be undone. This will permanently delete this transaction.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfirmation(transaction.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No transactions recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
