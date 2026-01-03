import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Eye,
  Edit2,
  Loader2,
  DollarSign,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Employee {
  id: string;
  employee_id: string;
  email: string;
  role: 'employee' | 'admin';
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  profile_picture_url: string | null;
}

interface Payroll {
  id?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  tax_deduction: number;
  other_deductions: number;
}

export default function Employees() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [payrollData, setPayrollData] = useState<Payroll>({
    basic_salary: 0,
    housing_allowance: 0,
    transport_allowance: 0,
    other_allowances: 0,
    tax_deduction: 0,
    other_deductions: 0,
  });
  const [existingPayrollId, setExistingPayrollId] = useState<string | null>(null);
  const [savingPayroll, setSavingPayroll] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchEmployees();
  }, [profile, isAdmin, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        (emp) =>
          emp.first_name?.toLowerCase().includes(query) ||
          emp.last_name?.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employee_id.toLowerCase().includes(query) ||
          emp.department?.toLowerCase().includes(query) ||
          emp.position?.toLowerCase().includes(query)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error: any) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewDialogOpen(true);
  };

  const handleManagePayroll = async (employee: Employee) => {
    setSelectedEmployee(employee);

    // Fetch existing payroll
    const { data } = await supabase
      .from('payroll')
      .select('*')
      .eq('user_id', employee.id)
      .order('effective_date', { ascending: false })
      .maybeSingle();

    if (data) {
      setExistingPayrollId(data.id);
      setPayrollData({
        basic_salary: data.basic_salary,
        housing_allowance: data.housing_allowance || 0,
        transport_allowance: data.transport_allowance || 0,
        other_allowances: data.other_allowances || 0,
        tax_deduction: data.tax_deduction || 0,
        other_deductions: data.other_deductions || 0,
      });
    } else {
      setExistingPayrollId(null);
      setPayrollData({
        basic_salary: 0,
        housing_allowance: 0,
        transport_allowance: 0,
        other_allowances: 0,
        tax_deduction: 0,
        other_deductions: 0,
      });
    }

    setPayrollDialogOpen(true);
  };

  const handleSavePayroll = async () => {
    if (!selectedEmployee) return;
    setSavingPayroll(true);

    try {
      if (existingPayrollId) {
        const { error } = await supabase
          .from('payroll')
          .update({
            ...payrollData,
            effective_date: format(new Date(), 'yyyy-MM-dd'),
          })
          .eq('id', existingPayrollId);

        if (error) throw error;
        toast.success('Payroll updated successfully!');
      } else {
        const { error } = await supabase.from('payroll').insert({
          user_id: selectedEmployee.id,
          ...payrollData,
          effective_date: format(new Date(), 'yyyy-MM-dd'),
        });

        if (error) throw error;
        toast.success('Payroll created successfully!');
      }

      setPayrollDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payroll');
    } finally {
      setSavingPayroll(false);
    }
  };

  const getInitials = (employee: Employee) => {
    if (employee.first_name && employee.last_name) {
      return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
    }
    return employee.email[0].toUpperCase();
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Employee Directory</h1>
          <p className="text-muted-foreground">Manage all employees in the organization</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-4 h-4 mr-1" />
          {employees.length} Employees
        </Badge>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, ID, department, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-display text-lg">All Employees</CardTitle>
          <CardDescription>
            {filteredEmployees.length} of {employees.length} employees shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No employees match your search' : 'No employees found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.profile_picture_url || undefined} />
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {getInitials(employee)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                          {employee.role === 'admin' ? 'Admin' : 'Employee'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManagePayroll(employee)}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Employee Details</DialogTitle>
            <DialogDescription>View employee information</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedEmployee.profile_picture_url || undefined} />
                  <AvatarFallback className="text-xl bg-accent text-accent-foreground">
                    {getInitials(selectedEmployee)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <p className="text-muted-foreground">{selectedEmployee.position || 'No position set'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{selectedEmployee.employee_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant={selectedEmployee.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedEmployee.role === 'admin' ? 'Admin' : 'Employee'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="font-medium">{selectedEmployee.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="font-medium">{selectedEmployee.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Department
                  </p>
                  <p className="font-medium">{selectedEmployee.department || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Position
                  </p>
                  <p className="font-medium">{selectedEmployee.position || '-'}</p>
                </div>
              </div>

              {selectedEmployee.hire_date && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {format(parseISO(selectedEmployee.hire_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payroll Dialog */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {existingPayrollId ? 'Update' : 'Set'} Payroll
            </DialogTitle>
            <DialogDescription>
              Manage salary structure for {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={payrollData.basic_salary}
                onChange={(e) =>
                  setPayrollData({ ...payrollData, basic_salary: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Housing Allowance</Label>
                <Input
                  type="number"
                  value={payrollData.housing_allowance}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, housing_allowance: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Transport Allowance</Label>
                <Input
                  type="number"
                  value={payrollData.transport_allowance}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, transport_allowance: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Other Allowances</Label>
              <Input
                type="number"
                value={payrollData.other_allowances}
                onChange={(e) =>
                  setPayrollData({ ...payrollData, other_allowances: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Deduction</Label>
                <Input
                  type="number"
                  value={payrollData.tax_deduction}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, tax_deduction: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Other Deductions</Label>
                <Input
                  type="number"
                  value={payrollData.other_deductions}
                  onChange={(e) =>
                    setPayrollData({ ...payrollData, other_deductions: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Estimated Net Salary</span>
                <span className="font-display text-xl font-bold text-accent">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(
                    payrollData.basic_salary +
                      payrollData.housing_allowance +
                      payrollData.transport_allowance +
                      payrollData.other_allowances -
                      payrollData.tax_deduction -
                      payrollData.other_deductions
                  )}
                </span>
              </div>
            </div>

            <Button onClick={handleSavePayroll} className="w-full" disabled={savingPayroll}>
              {savingPayroll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : existingPayrollId ? (
                'Update Payroll'
              ) : (
                'Create Payroll'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
