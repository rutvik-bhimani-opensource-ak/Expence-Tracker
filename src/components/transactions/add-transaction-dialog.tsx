
'use client';
import { useState, useEffect } from 'react';
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
import type { Category, Transaction, Account } from '@/lib/types';
import { AllCategories, ExpenseCategories, IncomeCategories } from '@/lib/types';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction'; 
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, Landmark, Wallet } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/category-utils';

const transactionFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date({ required_error: "Date is required" }),
  type: z.enum(['income', 'expense']),
  category: z.custom<Category>(val => AllCategories.includes(val as Category), "Invalid category"),
  accountId: z.enum(['primary', 'cash'], { required_error: "Account is required" }),
  vendor: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTransaction?: Partial<TransactionFormValues & { id?: string }>; 
}

export function AddTransactionDialog({ open, onOpenChange, defaultTransaction }: AddTransactionDialogProps) {
  const { addTransaction, accounts, getAccountById } = useAppData();
  const { toast } = useToast();
  const [isCategorizing, setIsCategorizing] = useState(false);
  
  const defaultType = defaultTransaction?.type || 'expense';
  const initialCategories = defaultType === 'income' ? IncomeCategories : ExpenseCategories;
  const defaultCategory = defaultTransaction?.category || initialCategories[0];
  const defaultAccountId = defaultTransaction?.accountId || 'primary';

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: defaultTransaction?.description || '',
      amount: defaultTransaction?.amount || undefined,
      date: defaultTransaction?.date ? new Date(defaultTransaction.date) : new Date(),
      type: defaultType,
      category: defaultCategory,
      accountId: defaultAccountId,
      vendor: defaultTransaction?.vendor || '',
    },
  });
  
  const transactionType = form.watch('type');
  const transactionDescription = form.watch('description');
  const transactionVendor = form.watch('vendor');

  const [availableCategories, setAvailableCategories] = useState<Category[]>(initialCategories);

  useEffect(() => {
    const newAvailableCategories = transactionType === 'income' ? IncomeCategories : ExpenseCategories;
    setAvailableCategories(newAvailableCategories);
    if (defaultTransaction?.id && defaultTransaction.category && newAvailableCategories.includes(defaultTransaction.category as Category)) {
         form.setValue('category', defaultTransaction.category as Category);
    } else if (!newAvailableCategories.includes(form.getValues('category') as Category)) {
       form.setValue('category', newAvailableCategories[0]);
    }
  }, [transactionType, form, defaultTransaction]);

  useEffect(() => {
    if (open) {
      form.reset({
        description: defaultTransaction?.description || '',
        amount: defaultTransaction?.amount || undefined,
        date: defaultTransaction?.date ? new Date(defaultTransaction.date) : new Date(),
        type: defaultTransaction?.type || 'expense',
        category: defaultTransaction?.category || (defaultTransaction?.type === 'income' ? IncomeCategories[0] : ExpenseCategories[0]),
        accountId: defaultTransaction?.accountId || 'primary',
        vendor: defaultTransaction?.vendor || '',
      });
    }
  }, [open, defaultTransaction, form]);


  const handleAICategorize = async () => {
    if (!transactionDescription) {
      toast({ title: "Cannot Categorize", description: "Please enter a description first.", variant: "destructive" });
      return;
    }
    setIsCategorizing(true);
    try {
      const result = await categorizeTransaction({
        transactionDescription,
        vendorName: transactionVendor,
      });
      if (result.category && AllCategories.includes(result.category as Category)) {
        const currentValidCategories = form.getValues('type') === 'income' ? IncomeCategories : ExpenseCategories;
        if (currentValidCategories.includes(result.category as Category)) {
            form.setValue('category', result.category as Category);
            toast({ title: "Categorized!", description: `Transaction set to ${result.category} with ${Math.round(result.confidence * 100)}% confidence.` });
        } else {
            toast({ title: "AI Category Mismatch", description: `AI suggested '${result.category}', which is not valid for ${form.getValues('type')}. Please select manually.`, variant: "destructive" });
        }
      } else {
        toast({ title: "AI Categorization Failed", description: "Could not determine a valid category. Please select manually.", variant: "destructive" });
      }
    } catch (error) {
      console.error("AI Categorization error:", error);
      toast({ title: "AI Error", description: "An error occurred during AI categorization.", variant: "destructive" });
    } finally {
      setIsCategorizing(false);
    }
  };

  function onSubmit(data: TransactionFormValues) {
    // Assuming addTransaction in context now handles accountId correctly
    addTransaction({
      ...data,
      date: data.date.toISOString(),
    });
    const accountName = getAccountById(data.accountId)?.name || data.accountId;
    toast({ title: "Transaction Added", description: `${data.description} for ₹${data.amount.toFixed(2)} from ${accountName} was added.` });
    // Reset form after submission
    form.reset({ 
        description: '', 
        amount: undefined, 
        date: new Date(), 
        type: 'expense', 
        category: ExpenseCategories[0], 
        accountId: 'primary',
        vendor: '' 
    });
    onOpenChange(false);
  }
  
  const accountOptions: { value: 'primary' | 'cash'; label: string; icon: React.ElementType }[] = [
    { value: 'primary', label: getAccountById('primary')?.name || 'Main Account', icon: Landmark },
    { value: 'cash', label: getAccountById('cash')?.name || 'Cash Account', icon: Wallet },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            form.reset({ 
                description: '', 
                amount: undefined, 
                date: new Date(), 
                type: 'expense', 
                category: ExpenseCategories[0], 
                accountId: 'primary',
                vendor: '' 
            });
        }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{defaultTransaction?.id ? 'Edit' : 'Add New'} Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details of your transaction. Use AI to help categorize it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Input id="description" {...form.register("description")} className="col-span-3" />
            {form.formState.errors.description && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
            <Input id="amount" type="number" step="0.01" {...form.register("amount")} className="col-span-3" />
            {form.formState.errors.amount && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.amount.message}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.date && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountId" className="text-right">Account</Label>
            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
             {form.formState.errors.accountId && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.accountId.message}</p>}
          </div>


          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => {
                      const IconComponent = getCategoryIcon(cat);
                      return (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center">
                            <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />
                            {cat}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
             <Button type="button" variant="outline" onClick={handleAICategorize} disabled={isCategorizing} className="col-span-1 text-xs p-2 h-auto">
              {isCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : "AI"}
            </Button>
            {form.formState.errors.category && <p className="col-span-4 text-destructive text-sm text-right">{form.formState.errors.category.message}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vendor" className="text-right">Vendor</Label>
            <Input id="vendor" {...form.register("vendor")} className="col-span-3" placeholder="(Optional)" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
                 onOpenChange(false); 
                 form.reset({ description: '', amount: undefined, date: new Date(), type: 'expense', category: ExpenseCategories[0], accountId: 'primary', vendor: '' });
            }}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {defaultTransaction?.id ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
