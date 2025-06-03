
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Download, RotateCcw, CalendarCog, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Transaction } from '@/lib/types';

const accountFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  initialBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

const systemDateFormSchema = z.object({
  month: z.coerce.number().min(0).max(11),
  year: z.coerce.number().min(1900).max(2100, "Year must be between 1900 and 2100"),
});
type SystemDateFormValues = z.infer<typeof systemDateFormSchema>;

export default function SettingsPage() {
  const { 
    accounts, updateAccount, updateAccountBalance,
    getAllData, resetAllData,
    systemMonth, systemYear, setSystemDate,
    isDataLoading
  } = useAppData();
  const { toast } = useToast();
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [isProcessingJSONExport, setIsProcessingJSONExport] = useState(false);
  const [isProcessingXLSXExport, setIsProcessingXLSXExport] = useState(false);
  
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: "Main Account",
      initialBalance: 0,
    }
  });

  const systemDateForm = useForm<SystemDateFormValues>({
    resolver: zodResolver(systemDateFormSchema),
    defaultValues: {
      month: systemMonth,
      year: systemYear,
    }
  });

  useEffect(() => {
    if (primaryAccount) {
      accountForm.reset({
        accountName: primaryAccount.name,
        initialBalance: primaryAccount.balance
      });
    }
  }, [primaryAccount, accountForm]);

  useEffect(() => {
    systemDateForm.reset({ month: systemMonth, year: systemYear });
  }, [systemMonth, systemYear, systemDateForm]);

  const onAccountSubmit = async (data: AccountFormValues) => {
    if (primaryAccount) {
      await updateAccount({ ...primaryAccount, name: data.accountName });
      if (primaryAccount.balance !== data.initialBalance) {
        await updateAccountBalance(primaryAccount.id, data.initialBalance);
      }
      toast({ title: "Account Updated", description: `${data.accountName} settings saved.` });
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
      link.download = `frugalflow_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
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
      const { transactions } = await getAllData();

      if (transactions.length === 0) {
        toast({ title: "No Data to Export", description: "There are no transactions to export to XLSX.", variant: "default" });
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
        const sheetName = format(new Date(monthYearKey + '-01'), 'MMM yyyy'); // Ensure date is parsed correctly for sheet name
        const monthTransactions = groupedTransactions[monthYearKey];
        
        const sheetData = monthTransactions.map(t => ({
          Date: format(new Date(t.date), 'yyyy-MM-dd'),
          Description: t.description,
          Category: t.category,
          Type: t.type,
          'Amount (₹)': t.amount.toFixed(2),
          Vendor: t.vendor || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      XLSX.writeFile(workbook, `frugalflow_monthly_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
      // Ensure accountForm and systemDateForm are reset to reflect the new state
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      systemDateForm.reset({ month: currentMonth, year: currentYear });
      if (accounts.length > 0 && accounts[0].name) { // Check if account exists before trying to reset form with its name
         accountForm.reset({ accountName: accounts[0].name, initialBalance: 0 });
      } else {
         accountForm.reset({ accountName: "Main Account", initialBalance: 0 });
      }
      toast({ title: "Data Reset", description: "All transactions and budgets have been deleted. Your primary account balance has been reset to ₹0.00.", variant: "destructive" });
    } catch (error) {
      console.error("Reset error:", error);
      toast({ title: "Reset Failed", description: "Could not reset data.", variant: "destructive" });
    } finally {
      setIsProcessingReset(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i), 'MMMM'),
  }));

  const currentSystemDateFormatted = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  if (isDataLoading && !primaryAccount) {
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
          <CardTitle>{primaryAccount ? 'Manage Account' : 'Account Details'}</CardTitle>
          <CardDescription>{primaryAccount ? 'Manage your primary account details.' : 'Primary account details (balance is updated via transactions).'}</CardDescription>
        </CardHeader>
        <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" {...accountForm.register("accountName")} disabled={!primaryAccount || accountForm.formState.isSubmitting} />
              {accountForm.formState.errors.accountName && <p className="text-sm text-destructive">{accountForm.formState.errors.accountName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="initialBalance">Current Balance (₹)</Label>
              <Input id="initialBalance" type="number" step="0.01" {...accountForm.register("initialBalance")} disabled={!primaryAccount || accountForm.formState.isSubmitting}/>
              {accountForm.formState.errors.initialBalance && <p className="text-sm text-destructive">{accountForm.formState.errors.initialBalance.message}</p>}
              <p className="text-xs text-muted-foreground">Note: Balance is primarily updated by transactions. This field allows direct adjustment or setting an initial balance.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!primaryAccount || accountForm.formState.isSubmitting}>
              {accountForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Account Settings
            </Button>
          </CardFooter>
        </form>
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
                  This action cannot be undone. This will permanently delete all your transactions and budgets from the database. Your primary account balance will be reset to ₹0.00.
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
          <CardDescription>Customize the look and feel of FrugalFlow (Not implemented).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Theme customization options will be available here in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}
