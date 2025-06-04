
'use client';
import { useState, useMemo } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { PageHeader } from '@/components/shared/page-header';
import type { Transaction } from '@/lib/types';
import { DataTable } from '@/components/transactions/data-table/data-table';
import { getColumns } from '@/components/transactions/columns';


export default function TransactionsPage() {
  const { transactions, deleteTransaction, getAccountById } = useAppData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined); // For edit functionality

  // const handleEdit = (transaction: Transaction) => {
  //   setEditingTransaction(transaction);
  //   setIsAddDialogOpen(true);
  // };
  
  const columns = useMemo(() => getColumns(deleteTransaction, getAccountById /*, handleEdit */), [deleteTransaction, getAccountById]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" />
      
      <AddTransactionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        // defaultTransaction={editingTransaction}
      />
      
      <DataTable 
        columns={columns} 
        data={sortedTransactions} 
        onAddTransaction={() => {
          // setEditingTransaction(undefined);
          setIsAddDialogOpen(true);
        }}
      />
    </div>
  );
}
