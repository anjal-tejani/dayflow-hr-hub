import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  FileText,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PayrollRecord {
  id: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  tax_deduction: number;
  other_deductions: number;
  net_salary: number;
  effective_date: string;
}

export default function Payroll() {
  const { profile } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('payroll')
          .select('*')
          .eq('user_id', profile.id)
          .order('effective_date', { ascending: false })
          .maybeSingle();

        if (error) throw error;
        setPayroll(data);
      } catch (error: any) {
        console.error('Failed to load payroll:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [profile]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const earnings = [
    { label: 'Basic Salary', value: payroll?.basic_salary || 0, icon: DollarSign },
    { label: 'Housing Allowance', value: payroll?.housing_allowance || 0, icon: TrendingUp },
    { label: 'Transport Allowance', value: payroll?.transport_allowance || 0, icon: TrendingUp },
    { label: 'Other Allowances', value: payroll?.other_allowances || 0, icon: TrendingUp },
  ];

  const deductions = [
    { label: 'Tax Deduction', value: payroll?.tax_deduction || 0, icon: TrendingDown },
    { label: 'Other Deductions', value: payroll?.other_deductions || 0, icon: TrendingDown },
  ];

  const totalEarnings = earnings.reduce((sum, item) => sum + item.value, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No Payroll Information</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your salary structure hasn't been set up yet. Please contact your HR administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-primary-foreground/70 text-sm uppercase tracking-wide">Net Salary</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">
                {formatCurrency(payroll.net_salary)}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <Calendar className="w-4 h-4 text-primary-foreground/70" />
                <span className="text-primary-foreground/70 text-sm">
                  Effective from {format(parseISO(payroll.effective_date), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Earnings</CardTitle>
                <CardDescription>Monthly earnings breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {earnings.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold text-success">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Total Earnings</span>
              <span className="font-display text-xl font-bold text-success">
                {formatCurrency(totalEarnings)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Deductions</CardTitle>
                <CardDescription>Monthly deductions breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deductions.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold text-destructive">-{formatCurrency(item.value)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Total Deductions</span>
              <span className="font-display text-xl font-bold text-destructive">
                -{formatCurrency(totalDeductions)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-success/5 rounded-xl">
              <p className="text-muted-foreground text-sm">Total Earnings</p>
              <p className="font-display text-2xl font-bold text-success mt-1">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
            <div className="p-4 bg-destructive/5 rounded-xl">
              <p className="text-muted-foreground text-sm">Total Deductions</p>
              <p className="font-display text-2xl font-bold text-destructive mt-1">
                {formatCurrency(totalDeductions)}
              </p>
            </div>
            <div className="p-4 bg-accent/10 rounded-xl">
              <p className="text-muted-foreground text-sm">Net Salary</p>
              <p className="font-display text-2xl font-bold text-accent mt-1">
                {formatCurrency(payroll.net_salary)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Notice */}
      <Card className="border-0 shadow-md bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Salary Information</p>
              <p className="text-muted-foreground text-sm mt-1">
                This is a read-only view of your salary structure. For any questions or discrepancies,
                please contact your HR administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
