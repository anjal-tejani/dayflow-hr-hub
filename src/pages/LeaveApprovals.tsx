import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

type LeaveStatus = 'pending' | 'approved' | 'rejected';
type LeaveType = 'paid' | 'sick' | 'unpaid';

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: LeaveStatus;
  admin_comments: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    employee_id: string;
    department: string | null;
    profile_picture_url: string | null;
  };
}

export default function LeaveApprovals() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchLeaveRequests();
  }, [profile, isAdmin, navigate]);

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, profiles:user_id(first_name, last_name, employee_id, department, profile_picture_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: LeaveRequest, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminComment('');
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedRequest || !profile) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_comments: adminComment || null,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setActionDialogOpen(false);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} leave request`);
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (profile: LeaveRequest['profiles']) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'paid':
        return <Badge variant="secondary">Paid</Badge>;
      case 'sick':
        return <Badge className="bg-info text-info-foreground">Sick</Badge>;
      case 'unpaid':
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className={`border-0 shadow-md cursor-pointer transition-all ${
            activeTab === 'pending' ? 'ring-2 ring-warning' : ''
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Approval</p>
                <p className="font-display text-3xl font-bold text-warning">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-0 shadow-md cursor-pointer transition-all ${
            activeTab === 'approved' ? 'ring-2 ring-success' : ''
          }`}
          onClick={() => setActiveTab('approved')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Approved</p>
                <p className="font-display text-3xl font-bold text-success">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-0 shadow-md cursor-pointer transition-all ${
            activeTab === 'rejected' ? 'ring-2 ring-destructive' : ''
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Rejected</p>
                <p className="font-display text-3xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-display text-lg">Leave Requests</CardTitle>
          <CardDescription>Review and manage employee leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No {activeTab} leave requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-border rounded-xl hover:border-accent/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.profiles.profile_picture_url || undefined} />
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {getInitials(request.profiles)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">
                                {request.profiles.first_name} {request.profiles.last_name}
                              </h4>
                              {getLeaveTypeBadge(request.leave_type)}
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.profiles.employee_id} • {request.profiles.department || 'No department'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {format(parseISO(request.start_date), 'MMM d')} -{' '}
                                {format(parseISO(request.end_date), 'MMM d, yyyy')}
                              </span>
                              <span className="text-muted-foreground">
                                ({differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1}{' '}
                                days)
                              </span>
                            </div>
                            {request.remarks && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                <span className="font-medium">Reason:</span> {request.remarks}
                              </p>
                            )}
                            {request.admin_comments && (
                              <p className="text-sm mt-2 p-2 bg-accent/10 rounded">
                                <span className="font-medium">Admin Comment:</span> {request.admin_comments}
                              </p>
                            )}
                          </div>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2 lg:flex-shrink-0">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAction(request, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction(request, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'Are you sure you want to approve this leave request?'
                : 'Are you sure you want to reject this leave request?'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">
                  {selectedRequest.profiles.first_name} {selectedRequest.profiles.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedRequest.start_date), 'MMM d')} -{' '}
                  {format(parseISO(selectedRequest.end_date), 'MMM d, yyyy')} (
                  {differenceInDays(
                    parseISO(selectedRequest.end_date),
                    parseISO(selectedRequest.start_date)
                  ) + 1}{' '}
                  days)
                </p>
                <div className="flex gap-2">
                  {getLeaveTypeBadge(selectedRequest.leave_type)}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Comment (Optional)
                </label>
                <Textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={`Add a comment for ${action === 'approve' ? 'approval' : 'rejection'}...`}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'success' : 'destructive'}
              onClick={processAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : action === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
