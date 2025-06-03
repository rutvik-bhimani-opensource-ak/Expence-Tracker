
'use client';
import { useState } from 'react';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle, Edit, Trash2, TrendingDown } from 'lucide-react';
import type { BudgetGoal } from '@/lib/types';

export default function BudgetsPage() {
  const { budgets, deleteBudget, getCategorySpentAmount } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | undefined>(undefined);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const handleAddNew = () => {
    setEditingBudget(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (budget: BudgetGoal) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };
  
  const handleDelete = (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
        deleteBudget(budgetId);
    }
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
                  <CardDescription>Limit: ${budget.limit.toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={Math.min(progress, 100)} className={progress > 100 ? '[&>div]:bg-destructive' : ''} />
                  <div className="flex justify-between text-sm">
                    <span>Spent: ${spentAmount.toFixed(2)}</span>
                    <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
                      {remaining >= 0 ? `Remaining: $${remaining.toFixed(2)}` : `Overspent: $${(-remaining).toFixed(2)}`}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
