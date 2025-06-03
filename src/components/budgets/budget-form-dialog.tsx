
'use client';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppData } from '@/contexts/app-data-context';
import type { BudgetGoal, Category } from '@/lib/types';
import { ExpenseCategories } from '@/lib/types'; 
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const budgetFormSchema = z.object({
  category: z.custom<Category>(val => ExpenseCategories.includes(val as Category), "Invalid category"),
  limit: z.coerce.number().positive("Limit must be a positive number"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetToEdit?: BudgetGoal;
}

export function BudgetFormDialog({ open, onOpenChange, budgetToEdit }: BudgetFormDialogProps) {
  const { addBudget, updateBudget, budgets } = useAppData();
  const { toast } = useToast();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: budgetToEdit?.category || ExpenseCategories[0],
      limit: budgetToEdit?.limit || undefined,
    },
  });
  
  useEffect(() => {
    if (budgetToEdit) {
      form.reset({
        category: budgetToEdit.category,
        limit: budgetToEdit.limit,
      });
    } else {
      form.reset({
        category: ExpenseCategories[0], // Ensure a default if no budgetToEdit and ExpenseCategories is not empty
        limit: undefined,
      });
    }
  }, [budgetToEdit, form, open]);


  const existingCategories = budgets.map(b => b.category);
  const availableCategories = ExpenseCategories.filter(
    cat => !existingCategories.includes(cat) || (budgetToEdit && cat === budgetToEdit.category)
  );


  function onSubmit(data: BudgetFormValues) {
    if (budgetToEdit) {
      updateBudget({ ...budgetToEdit, ...data });
      toast({ title: "Budget Updated", description: `Budget for ${data.category} updated to ₹${data.limit.toFixed(2)}.` });
    } else {
      addBudget(data);
      toast({ title: "Budget Added", description: `Budget for ${data.category} set to ₹${data.limit.toFixed(2)}.` });
    }
    form.reset({ category: ExpenseCategories[0], limit: undefined });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{budgetToEdit ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
          <DialogDescription>
            Set a spending limit for a specific category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={!!budgetToEdit || availableCategories.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.length > 0 ? availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    )) : (
                       // Handle case where budgetToEdit.category might not be in availableCategories (if all are used)
                      <SelectItem value={budgetToEdit?.category || (ExpenseCategories.length > 0 ? ExpenseCategories[0] : "")} disabled={!budgetToEdit}>
                        {budgetToEdit ? budgetToEdit.category : "No categories available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">Limit (₹)</Label>
            <Input id="limit" type="number" step="0.01" {...form.register("limit")} className="col-span-3" />
            {form.formState.errors.limit && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.limit.message}</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset({ category: ExpenseCategories[0], limit: undefined }); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit">{budgetToEdit ? 'Save Changes' : 'Add Budget'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
