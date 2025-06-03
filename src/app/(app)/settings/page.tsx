
'use client';
import { useAppData } from '@/contexts/app-data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const accountFormSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  initialBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});
type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function SettingsPage() {
  const { accounts, updateAccount, addAccount } = useAppData();
  const { toast } = useToast();
  
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: primaryAccount?.name || "Main Account",
      initialBalance: primaryAccount?.balance || 0,
    }
  });

  useEffect(() => {
    if (primaryAccount) {
      form.reset({
        accountName: primaryAccount.name,
        initialBalance: primaryAccount.balance
      });
    }
  }, [primaryAccount, form]);

  const onSubmit = (data: AccountFormValues) => {
    if (primaryAccount) {
      updateAccount({ ...primaryAccount, name: data.accountName, balance: data.initialBalance });
      toast({ title: "Account Updated", description: `${data.accountName} balance set to ₹${data.initialBalance.toFixed(2)}.` });
    } else {
      addAccount({ name: data.accountName, balance: data.initialBalance });
      toast({ title: "Account Added", description: `${data.accountName} created with balance ₹${data.initialBalance.toFixed(2)}.` });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Manage your primary account details.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" {...form.register("accountName")} />
              {form.formState.errors.accountName && <p className="text-sm text-destructive">{form.formState.errors.accountName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="initialBalance">Current Balance (₹)</Label>
              <Input id="initialBalance" type="number" step="0.01" {...form.register("initialBalance")} />
              {form.formState.errors.initialBalance && <p className="text-sm text-destructive">{form.formState.errors.initialBalance.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Settings</Button>
          </CardFooter>
        </form>
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
