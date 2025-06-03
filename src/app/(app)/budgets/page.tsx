
'use client';
import { useState, useEffect } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit, Trash2, TrendingDown } from 'lucide-react';
import type { BudgetGoal } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function BudgetsPage() {
  const { budgets, deleteBudget, getCategorySpentAmount } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | undefined>(undefined);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  }, []);


  const handleAddNew = () => {
    setEditingBudget(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (budget: BudgetGoal) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };
  
  const handleDeleteConfirmation = (budgetId: string) => {
    deleteBudget(budgetId);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Budget
        </Button>
      </PageHeader>

      <BudgetFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        budgetToEdit={editingBudget}
      />

      {budgets.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
             <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>No Budgets Yet</CardTitle>
            <CardDescription>Create budgets to track your spending against your goals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spentAmount = getCategorySpentAmount(budget.category, currentMonth, currentYear);
            const progress = budget.limit > 0 ? (spentAmount / budget.limit) * 100 : 0;
            const remaining = budget.limit - spentAmount;

            return (
              <Card key={budget.id}>
                <CardHeader>
                  <CardTitle>{budget.category}</CardTitle>
                  <CardDescription>Limit: ₹{budget.limit.toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={Math.min(progress, 100)} className={progress > 100 ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'} />
                  <div className="flex justify-between text-sm">
                    <span>Spent: ₹{spentAmount.toFixed(2)}</span>
                    <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
                      {remaining >= 0 ? `Remaining: ₹${remaining.toFixed(2)}` : `Overspent: ₹${(-remaining).toFixed(2)}`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this budget.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfirmation(budget.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
