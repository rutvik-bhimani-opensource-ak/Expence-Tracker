
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { useForm, Controller, useForm as useFormCreditCard } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Download, RotateCcw, CalendarCog, Loader2, FileSpreadsheet, Landmark, Wallet, PlusCircle, Trash2, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Transaction, Account } from '@/lib/types';

const accountFormSchema = z.object({
  accountId: z.enum(['primary', 'cash']),
  accountName: z.string().min(1, "Account name is required"),
  currentBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

const systemDateFormSchema = z.object({
  month: z.coerce.number().min(0).max(11),
  year: z.coerce.number().min(1900).max(2100, "Year must be between 1900 and 2100"),
});
type SystemDateFormValues = z.infer<typeof systemDateFormSchema>;

const creditCardFormSchema = z.object({
  name: z.string().min(1, "Card name is required"),
  limit: z.coerce.number().positive("Credit limit must be a positive number"),
});
type CreditCardFormValues = z.infer<typeof creditCardFormSchema>;


export default function SettingsPage() {
  const { 
    accounts, updateAccountName, updateAccountBalance,
    creditCards, addCreditCard, deleteCreditCard,
    getAllData, resetAllData,
    systemMonth, systemYear, setSystemDate,
    isDataLoading, getAccountById
  } = useAppData();
  const { toast } = useToast();
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [isProcessingJSONExport, setIsProcessingJSONExport] = useState(false);
  const [isProcessingXLSXExport, setIsProcessingXLSXExport] = useState(false);
  const [selectedAccountIdForEdit, setSelectedAccountIdForEdit] = useState<'primary' | 'cash'>('primary');
  
  const accountToEdit = getAccountById(selectedAccountIdForEdit);

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountId: 'primary',
      accountName: "",
      currentBalance: 0,
    }
  });

  const systemDateForm = useForm<SystemDateFormValues>({
    resolver: zodResolver(systemDateFormSchema),
    defaultValues: {
      month: systemMonth,
      year: systemYear,
    }
  });
  
  const creditCardForm = useFormCreditCard<CreditCardFormValues>({
    resolver: zodResolver(creditCardFormSchema),
    defaultValues: {
        name: "",
        limit: undefined,
    }
  });

  useEffect(() => {
    if (accountToEdit) {
      accountForm.reset({
        accountId: accountToEdit.id,
        accountName: accountToEdit.name,
        currentBalance: accountToEdit.balance
      });
    } else {
       // If accountToEdit is undefined (e.g. during initial load before accounts are fetched)
      const fallbackAccount = getAccountById('primary') || { id: 'primary', name: 'Main Account', balance: 0 };
       accountForm.reset({
        accountId: fallbackAccount.id,
        accountName: fallbackAccount.name,
        currentBalance: fallbackAccount.balance
      });
    }
  }, [accountToEdit, accountForm, getAccountById]);

  useEffect(() => {
    systemDateForm.reset({ month: systemMonth, year: systemYear });
  }, [systemMonth, systemYear, systemDateForm]);

  const onAccountSubmit = async (data: AccountFormValues) => {
    if (data.accountName !== accountToEdit?.name) {
      await updateAccountName(data.accountId, data.accountName);
    }
    if (data.currentBalance !== accountToEdit?.balance) {
      await updateAccountBalance(data.accountId, data.currentBalance);
    }
    toast({ title: "Account Updated", description: `${data.accountName} settings saved.` });
  };
  
  const onCreditCardSubmit = async (data: CreditCardFormValues) => {
    try {
        await addCreditCard(data);
        toast({ title: "Credit Card Added", description: `${data.name} has been added.` });
        creditCardForm.reset();
    } catch (error) {
        console.error("Failed to add credit card:", error);
        toast({ title: "Error", description: "Failed to add credit card.", variant: "destructive"});
    }
  };

  const onSystemDateSubmit = async (data: SystemDateFormValues) => {
    await setSystemDate(data.month, data.year);
    toast({ title: "System Date Updated", description: `System date set to ${format(new Date(data.year, data.month), 'MMMM yyyy')}.` });
  };

  const handleExportDataJSON = async () => {
    setIsProcessingJSONExport(true);
    try {
      const data = await getAllData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `budgetwise_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      toast({ title: "Data Exported (JSON)", description: "Your data has been downloaded as a JSON file." });
    } catch (error) {
      console.error("JSON Export error:", error);
      toast({ title: "JSON Export Failed", description: "Could not export data as JSON.", variant: "destructive" });
    } finally {
      setIsProcessingJSONExport(false);
    }
  };

  const handleExportDataXLSX = async () => {
    setIsProcessingXLSXExport(true);
    try {
      const { transactions, accounts: exportedAccounts } = await getAllData();

      if (transactions.length === 0) {
        toast({ title: "No Data to Export", description: "There are no transactions to export to XLSX.", variant: "default" });
        setIsProcessingXLSXExport(false);
        return;
      }

      const groupedTransactions: Record<string, Transaction[]> = {};
      transactions.forEach(t => {
        const monthYearKey = format(new Date(t.date), 'yyyy-MM');
        if (!groupedTransactions[monthYearKey]) {
          groupedTransactions[monthYearKey] = [];
        }
        groupedTransactions[monthYearKey].push(t);
      });

      const workbook = XLSX.utils.book_new();

      Object.keys(groupedTransactions).sort().forEach(monthYearKey => {
        const sheetName = format(new Date(monthYearKey + '-01'), 'MMM yyyy');
        const monthTransactions = groupedTransactions[monthYearKey];
        
        const sheetData = monthTransactions.map(t => ({
          Date: format(new Date(t.date), 'yyyy-MM-dd'),
          Description: t.description,
          Category: t.category,
          Type: t.type,
          Account: exportedAccounts.find(a => a.id === t.accountId)?.name || t.accountId,
          'Amount (₹)': t.amount.toFixed(2),
          Vendor: t.vendor || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      XLSX.writeFile(workbook, `budgetwise_monthly_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast({ title: "Data Exported (XLSX)", description: "Your data has been exported month-wise as an XLSX file." });

    } catch (error) {
      console.error("XLSX Export error:", error);
      toast({ title: "XLSX Export Failed", description: "Could not export data as XLSX.", variant: "destructive" });
    } finally {
      setIsProcessingXLSXExport(false);
    }
  };

  const handleResetData = async () => {
    setIsProcessingReset(true);
    try {
      await resetAllData();
      // Form reset will be handled by useEffect watching accountToEdit
      toast({ title: "Data Reset", description: "All transactions and budgets have been deleted. Account balances reset to ₹0.00.", variant: "destructive" });
    } catch (error) {
      console.error("Reset error:", error);
      toast({ title: "Reset Failed", description: "Could not reset data.", variant: "destructive" });
    } finally {
      setIsProcessingReset(false);
    }
  };
  
  const accountOptions: { value: 'primary' | 'cash'; label: string; icon: React.ElementType }[] = [
    { value: 'primary', label: getAccountById('primary')?.name || 'Main Account', icon: Landmark },
    { value: 'cash', label: getAccountById('cash')?.name || 'Cash Account', icon: Wallet },
  ];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i), 'MMMM'),
  }));

  const currentSystemDateFormatted = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  if (isDataLoading && accounts.length < 2) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Account</CardTitle>
          <CardDescription>Select an account to manage its details. Balance is primarily updated by transactions.</CardDescription>
        </CardHeader>
        <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="selectAccountForEdit">Account to Manage</Label>
                <Select 
                    value={selectedAccountIdForEdit} 
                    onValueChange={(value: 'primary' | 'cash') => setSelectedAccountIdForEdit(value)}
                    disabled={accountForm.formState.isSubmitting}
                >
                  <SelectTrigger id="selectAccountForEdit">
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
            </div>
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Controller
                name="accountName"
                control={accountForm.control}
                render={({ field }) => <Input id="accountName" {...field} disabled={!accountToEdit || accountForm.formState.isSubmitting} />}
              />
              {accountForm.formState.errors.accountName && <p className="text-sm text-destructive">{accountForm.formState.errors.accountName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="currentBalance">Current Balance (₹)</Label>
               <Controller
                name="currentBalance"
                control={accountForm.control}
                render={({ field }) => <Input id="currentBalance" type="number" step="0.01" {...field} disabled={!accountToEdit || accountForm.formState.isSubmitting} />}
              />
              {accountForm.formState.errors.currentBalance && <p className="text-sm text-destructive">{accountForm.formState.errors.currentBalance.message}</p>}
              <p className="text-xs text-muted-foreground">Note: Balance is primarily updated by transactions. This field allows direct adjustment.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!accountToEdit || accountForm.formState.isSubmitting}>
              {accountForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Account Settings
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Management</CardTitle>
          <CardDescription>Add and manage your credit cards here.</CardDescription>
        </CardHeader>
        <form onSubmit={creditCardForm.handleSubmit(onCreditCardSubmit)}>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="creditCardName">Card Name</Label>
                        <Input id="creditCardName" {...creditCardForm.register("name")} placeholder="e.g., HDFC Millennia" />
                        {creditCardForm.formState.errors.name && <p className="text-sm text-destructive">{creditCardForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="creditCardLimit">Credit Limit (₹)</Label>
                        <Input id="creditCardLimit" type="number" step="1000" {...creditCardForm.register("limit")} placeholder="e.g., 150000" />
                        {creditCardForm.formState.errors.limit && <p className="text-sm text-destructive">{creditCardForm.formState.errors.limit.message}</p>}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={creditCardForm.formState.isSubmitting}>
                    {creditCardForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Credit Card
                </Button>
            </CardFooter>
        </form>

        {creditCards.length > 0 && (
            <>
                <CardHeader className="pt-0">
                    <CardTitle className="text-lg">Your Credit Cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {creditCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                            <div className="flex items-center">
                                <CreditCard className="mr-3 h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{card.name}</p>
                                    <p className="text-sm text-muted-foreground">Limit: ₹{card.limit.toFixed(2)}</p>
                                </div>
                            </div>
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
                                    This will permanently delete the <strong>{card.name}</strong> card and may affect related transactions. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                    onClick={() => deleteCreditCard(card.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                    Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </CardContent>
            </>
        )}
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>System Date Configuration</CardTitle>
          <CardDescription>
            Set the global month and year for calculations and displays. Currently viewing: <strong>{currentSystemDateFormatted}</strong>
          </CardDescription>
        </CardHeader>
        <form onSubmit={systemDateForm.handleSubmit(onSystemDateSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="month">Month</Label>
                <Controller
                  control={systemDateForm.control}
                  name="month"
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()} disabled={systemDateForm.formState.isSubmitting}>
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {systemDateForm.formState.errors.month && <p className="text-sm text-destructive">{systemDateForm.formState.errors.month.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" {...systemDateForm.register("year")} disabled={systemDateForm.formState.isSubmitting} />
                {systemDateForm.formState.errors.year && <p className="text-sm text-destructive">{systemDateForm.formState.errors.year.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={systemDateForm.formState.isSubmitting}>
              {systemDateForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CalendarCog className="mr-2 h-4 w-4" /> Set System Date
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your current data or reset all application data.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportDataJSON} variant="outline" disabled={isProcessingJSONExport}>
            {isProcessingJSONExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
             Export JSON
          </Button>
          <Button onClick={handleExportDataXLSX} variant="outline" disabled={isProcessingXLSXExport}>
            {isProcessingXLSXExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
             Export XLSX (Month-wise)
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isProcessingReset}>
                {isProcessingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                 Reset Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your transactions, budgets and credit cards. Account balances will be reset to ₹0.00.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Yes, Reset All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground">Data is stored in Firebase Firestore. Ensure your Firebase project is correctly configured.</p>
        </CardFooter>
      </Card>
       
       <Card>
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
          <CardDescription>Customize the look and feel of BudgetWise (Not implemented).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Theme customization options will be available here in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}
