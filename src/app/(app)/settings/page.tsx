
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
import { useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Download, RotateCcw, CalendarCog } from 'lucide-react';

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
    accounts, updateAccount, addAccount, 
    getAllData, resetAllData,
    systemMonth, systemYear, setSystemDate
  } = useAppData();
  const { toast } = useToast();
  
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: primaryAccount?.name || "Main Account",
      initialBalance: primaryAccount?.balance || 0,
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

  const onAccountSubmit = (data: AccountFormValues) => {
    if (primaryAccount) {
      updateAccount({ ...primaryAccount, name: data.accountName, balance: data.initialBalance });
      toast({ title: "Account Updated", description: `${data.accountName} balance set to ₹${data.initialBalance.toFixed(2)}.` });
    } else {
      addAccount({ name: data.accountName, balance: data.initialBalance });
      toast({ title: "Account Created", description: `${data.accountName} created with balance ₹${data.initialBalance.toFixed(2)}.` });
    }
  };

  const onSystemDateSubmit = (data: SystemDateFormValues) => {
    setSystemDate(data.month, data.year);
    toast({ title: "System Date Updated", description: `System date set to ${format(new Date(data.year, data.month), 'MMMM yyyy')}.` });
  };

  const handleExportData = () => {
    const data = getAllData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `frugalflow_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    toast({ title: "Data Exported", description: "Your data has been downloaded as a JSON file." });
  };

  const handleResetData = () => {
    resetAllData();
    toast({ title: "Data Reset", description: "All application data has been reset to demo values.", variant: "destructive" });
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2000, i), 'MMMM'),
  }));

  const currentSystemDateFormatted = format(new Date(systemYear, systemMonth), 'MMMM yyyy');

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>{primaryAccount ? 'Manage Account' : 'Create Account'}</CardTitle>
          <CardDescription>{primaryAccount ? 'Manage your primary account details.' : 'Set up your primary account.'}</CardDescription>
        </CardHeader>
        <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" {...accountForm.register("accountName")} />
              {accountForm.formState.errors.accountName && <p className="text-sm text-destructive">{accountForm.formState.errors.accountName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="initialBalance">Current Balance (₹)</Label>
              <Input id="initialBalance" type="number" step="0.01" {...accountForm.register("initialBalance")} />
              {accountForm.formState.errors.initialBalance && <p className="text-sm text-destructive">{accountForm.formState.errors.initialBalance.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Account Settings</Button>
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
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
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
                <Input id="year" type="number" {...systemDateForm.register("year")} />
                {systemDateForm.formState.errors.year && <p className="text-sm text-destructive">{systemDateForm.formState.errors.year.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <CalendarCog className="mr-2 h-4 w-4" /> Set System Date
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your current data or reset to the application's initial state.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your current application data (transactions, budgets, accounts) and reset the application to its initial demo state.
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
