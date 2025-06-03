
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
import { Download, RotateCcw, CalendarCog, Loader2 } from 'lucide-react';

const accountFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  // Balance management is now primarily through transactions, but allow direct setting here.
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
    accounts, updateAccount, updateAccountBalance, // addAccount is less relevant if we stick to one primary
    getAllData, resetAllData,
    systemMonth, systemYear, setSystemDate,
    isDataLoading
  } = useAppData();
  const { toast } = useToast();
  const [isProcessingReset, setIsProcessingReset] = useState(false);
  const [isProcessingExport, setIsProcessingExport] = useState(false);
  
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: "Main Account", // Default placeholder
      initialBalance: 0,
    }
  });

  const systemDateForm = useForm<SystemDateFormValues>({
    resolver: zodResolver(systemDateFormSchema),
    defaultValues: {
      month: systemMonth, // Will be updated by useEffect
      year: systemYear,   // Will be updated by useEffect
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
      // Update name via updateAccount, balance via updateAccountBalance
      await updateAccount({ ...primaryAccount, name: data.accountName });
      // Check if balance changed before calling update, to avoid unnecessary Firestore write
      if (primaryAccount.balance !== data.initialBalance) {
        await updateAccountBalance(primaryAccount.id, data.initialBalance);
      }
      toast({ title: "Account Updated", description: `${data.accountName} settings saved.` });
    } 
    // Creation of new "primary" account handled by context if it doesn't exist.
    // Here we mainly manage the existing primary account.
  };

  const onSystemDateSubmit = async (data: SystemDateFormValues) => {
    await setSystemDate(data.month, data.year);
    toast({ title: "System Date Updated", description: `System date set to ${format(new Date(data.year, data.month), 'MMMM yyyy')}.` });
  };

  const handleExportData = async () => {
    setIsProcessingExport(true);
    try {
      const data = await getAllData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `frugalflow_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      toast({ title: "Data Exported", description: "Your data has been downloaded as a JSON file." });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Export Failed", description: "Could not export data.", variant: "destructive" });
    } finally {
      setIsProcessingExport(false);
    }
  };

  const handleResetData = async () => {
    setIsProcessingReset(true);
    try {
      await resetAllData();
      toast({ title: "Data Reset", description: "All transactions and budgets have been deleted. Your account balance has been reset to ₹0.00.", variant: "destructive" });
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

  if (isDataLoading && !primaryAccount) { // Show loading only if critical data isn't there yet
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
              <Label htmlFor="initialBalance">Current Balance (₹) - Set initial or adjust</Label>
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
          <CardDescription>Export your current data or reset all application data to a clean slate.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportData} variant="outline" disabled={isProcessingExport}>
            {isProcessingExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
             Export Data
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
