import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle,
  XCircle,
  Minus,
  Loader2,
  Filter,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';

type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave';
type FilterType = 'all' | 'week' | 'month';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  notes: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    employee_id: string;
  };
}

export default function Attendance() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('week');

  const isAdmin = profile?.role === 'admin';

  const fetchAttendance = async () => {
    if (!profile) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      let query = supabase
        .from('attendance')
        .select('*, profiles:user_id(first_name, last_name, employee_id)')
        .order('date', { ascending: false });

      // Apply date filter
      if (filter === 'week') {
        const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
        query = query.gte('date', weekStart).lte('date', weekEnd);
      } else if (filter === 'month') {
        const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
        query = query.gte('date', monthStart).lte('date', monthEnd);
      }

      // If not admin, only show own records
      if (!isAdmin) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecords(data || []);

      // Find today's record
      const todayRec = data?.find((r) => r.date === today && r.user_id === profile.id);
      setTodayRecord(todayRec || null);
    } catch (error: any) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [profile, filter, isAdmin]);

  const handleCheckIn = async () => {
    if (!profile) return;
    setActionLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();

      const { error } = await supabase.from('attendance').insert({
        user_id: profile.id,
        date: today,
        check_in: now,
        status: 'present',
      });

      if (error) throw error;

      toast.success('Checked in successfully!');
      fetchAttendance();
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        toast.error('You have already checked in today');
      } else {
        toast.error(error.message || 'Failed to check in');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!profile || !todayRecord) return;
    setActionLoading(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('attendance')
        .update({ check_out: now })
        .eq('id', todayRecord.id);

      if (error) throw error;

      toast.success('Checked out successfully!');
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case 'half_day':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Minus className="w-3 h-3 mr-1" />
            Half Day
          </Badge>
        );
      case 'leave':
        return (
          <Badge className="bg-info text-info-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            Leave
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'h:mm a');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Today's Attendance Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-primary-foreground/70 text-sm uppercase tracking-wide">Today's Attendance</p>
              <h2 className="font-display text-3xl font-bold mt-1">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </h2>
              <p className="text-primary-foreground/80 mt-2">
                {todayRecord
                  ? `Checked in at ${formatTime(todayRecord.check_in)}`
                  : "You haven't checked in yet"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {!todayRecord ? (
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="min-w-[160px]"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <LogIn className="w-5 h-5 mr-2" />
                  )}
                  Check In
                </Button>
              ) : !todayRecord.check_out ? (
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="min-w-[160px]"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <LogOut className="w-5 h-5 mr-2" />
                  )}
                  Check Out
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-primary-foreground/20 px-6 py-3 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed for today</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Summary */}
          {todayRecord && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-primary-foreground/20">
              <div>
                <p className="text-primary-foreground/70 text-sm">Check In</p>
                <p className="font-semibold text-lg">{formatTime(todayRecord.check_in)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Check Out</p>
                <p className="font-semibold text-lg">{formatTime(todayRecord.check_out)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Status</p>
                <p className="font-semibold text-lg capitalize">{todayRecord.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Hours</p>
                <p className="font-semibold text-lg">
                  {todayRecord.check_in && todayRecord.check_out
                    ? `${Math.round(
                        (new Date(todayRecord.check_out).getTime() -
                          new Date(todayRecord.check_in).getTime()) /
                          (1000 * 60 * 60)
                      )}h`
                    : '-'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">
              {isAdmin ? 'All Attendance Records' : 'My Attendance History'}
            </CardTitle>
            <CardDescription>View attendance records and status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead>Employee</TableHead>}
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isToday(parseISO(record.date)) && (
                            <span className="w-2 h-2 bg-accent rounded-full" />
                          )}
                          {format(parseISO(record.date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {record.profiles?.first_name} {record.profiles?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.profiles?.employee_id}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{formatTime(record.check_in)}</TableCell>
                      <TableCell>{formatTime(record.check_out)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.check_in && record.check_out
                          ? `${(
                              (new Date(record.check_out).getTime() -
                                new Date(record.check_in).getTime()) /
                              (1000 * 60 * 60)
                            ).toFixed(1)}h`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
