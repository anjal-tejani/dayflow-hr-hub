import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalEmployees?: number;
  pendingLeaves?: number;
  todayPresent?: number;
  myPendingLeaves: number;
  myAttendanceToday: boolean;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    myPendingLeaves: 0,
    myAttendanceToday: false,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      try {
        // Fetch user's pending leaves
        const { data: pendingLeaves } = await supabase
          .from('leave_requests')
          .select('id')
          .eq('user_id', profile.id)
          .eq('status', 'pending');

        // Check if user has attendance today
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: todayAttendance } = await supabase
          .from('attendance')
          .select('id')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();

        let adminStats: Partial<DashboardStats> = {};

        if (isAdmin) {
          // Fetch total employees
          const { count: totalEmployees } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          // Fetch all pending leave requests
          const { count: allPendingLeaves } = await supabase
            .from('leave_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          // Fetch today's attendance count
          const { count: todayPresent } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .in('status', ['present', 'half_day']);

          adminStats = {
            totalEmployees: totalEmployees || 0,
            pendingLeaves: allPendingLeaves || 0,
            todayPresent: todayPresent || 0,
          };
        }

        // Fetch recent leave requests for activity
        const { data: recentLeaves } = await supabase
          .from('leave_requests')
          .select('*, profiles:user_id(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          ...adminStats,
          myPendingLeaves: pendingLeaves?.length || 0,
          myAttendanceToday: !!todayAttendance,
        });

        setRecentActivity(recentLeaves || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile, isAdmin]);

  const employeeCards = [
    {
      title: 'My Profile',
      description: 'View and update your information',
      icon: User,
      color: 'bg-info',
      path: '/profile',
    },
    {
      title: 'Attendance',
      description: stats.myAttendanceToday ? 'Checked in today' : 'Mark your attendance',
      icon: Clock,
      color: stats.myAttendanceToday ? 'bg-success' : 'bg-warning',
      path: '/attendance',
    },
    {
      title: 'Leave Requests',
      description: `${stats.myPendingLeaves} pending requests`,
      icon: Calendar,
      color: 'bg-accent',
      path: '/leave',
    },
    {
      title: 'Payroll',
      description: 'View your salary details',
      icon: DollarSign,
      color: 'bg-secondary',
      path: '/payroll',
    },
  ];

  const adminCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees || 0,
      icon: Users,
      color: 'bg-info',
      trend: '+2 this month',
    },
    {
      title: 'Present Today',
      value: stats.todayPresent || 0,
      icon: CheckCircle,
      color: 'bg-success',
      trend: `${Math.round(((stats.todayPresent || 0) / (stats.totalEmployees || 1)) * 100)}% attendance`,
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves || 0,
      icon: AlertCircle,
      color: 'bg-warning',
      trend: 'Awaiting approval',
    },
    {
      title: 'This Month',
      value: format(new Date(), 'MMMM'),
      icon: TrendingUp,
      color: 'bg-accent',
      trend: format(new Date(), 'yyyy'),
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground">
        <h1 className="font-display text-3xl font-bold mb-2">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {profile?.first_name}!
        </h1>
        <p className="text-primary-foreground/80 text-lg">
          {isAdmin
            ? "Here's an overview of your organization's HR metrics."
            : "Here's what's happening with your HR activities."}
        </p>
        <p className="text-primary-foreground/60 mt-2">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Admin Stats Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card, index) => (
            <Card key={index} className="card-hover border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
                    <p className="font-display text-3xl font-bold mt-2">{card.value}</p>
                    <p className="text-muted-foreground text-xs mt-1">{card.trend}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-xl`}>
                    <card.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {employeeCards.map((card, index) => (
            <Card
              key={index}
              className="card-hover cursor-pointer border-0 shadow-md group"
              onClick={() => navigate(card.path)}
            >
              <CardContent className="p-6">
                <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <card.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{card.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{card.description}</p>
                <div className="flex items-center text-accent mt-4 group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">View</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {activity.profiles?.first_name} {activity.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {activity.leave_type} Leave • {format(new Date(activity.start_date), 'MMM d')} - {format(new Date(activity.end_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg">Alerts & Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats.myAttendanceToday && (
                <div className="flex items-center gap-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-medium text-warning">Attendance Pending</p>
                    <p className="text-sm text-muted-foreground">You haven't marked attendance today</p>
                  </div>
                  <Button size="sm" variant="warning" onClick={() => navigate('/attendance')}>
                    Mark Now
                  </Button>
                </div>
              )}

              {stats.myPendingLeaves > 0 && (
                <div className="flex items-center gap-4 p-4 bg-info/10 border border-info/20 rounded-lg">
                  <Clock className="w-5 h-5 text-info flex-shrink-0" />
                  <div>
                    <p className="font-medium text-info">Leave Request Status</p>
                    <p className="text-sm text-muted-foreground">{stats.myPendingLeaves} pending request(s)</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/leave')}>
                    View
                  </Button>
                </div>
              )}

              {isAdmin && stats.pendingLeaves && stats.pendingLeaves > 0 && (
                <div className="flex items-center gap-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="font-medium text-accent">Action Required</p>
                    <p className="text-sm text-muted-foreground">{stats.pendingLeaves} leave request(s) need approval</p>
                  </div>
                  <Button size="sm" variant="accent" onClick={() => navigate('/leave-approvals')}>
                    Review
                  </Button>
                </div>
              )}

              {stats.myAttendanceToday && stats.myPendingLeaves === 0 && (!isAdmin || stats.pendingLeaves === 0) && (
                <div className="flex items-center gap-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <p className="font-medium text-success">All Caught Up!</p>
                    <p className="text-sm text-muted-foreground">No pending actions required</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
