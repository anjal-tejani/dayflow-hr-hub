import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Save,
  Loader2,
  Edit2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    hire_date: '',
    profile_picture_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        department: profile.department || '',
        position: profile.position || '',
        hire_date: profile.hire_date || '',
        profile_picture_url: profile.profile_picture_url || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // Employee can only update: phone, address, profile_picture_url
      // Admin can update all fields
      const updateData = isAdmin
        ? formData
        : {
            phone: formData.phone,
            address: formData.address,
            profile_picture_url: formData.profile_picture_url,
          };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const infoItems = [
    { label: 'Employee ID', value: profile?.employee_id, icon: User },
    { label: 'Email', value: profile?.email, icon: Mail },
    { label: 'Phone', value: formData.phone || 'Not set', icon: Phone, editable: true },
    { label: 'Address', value: formData.address || 'Not set', icon: MapPin, editable: true },
    { label: 'Department', value: formData.department || 'Not set', icon: Building2, adminEditable: true },
    { label: 'Position', value: formData.position || 'Not set', icon: Briefcase, adminEditable: true },
    {
      label: 'Hire Date',
      value: formData.hire_date ? format(new Date(formData.hire_date), 'MMMM d, yyyy') : 'Not set',
      icon: Calendar,
      adminEditable: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-accent" />
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
            <Avatar className="w-32 h-32 border-4 border-card shadow-lg">
              <AvatarImage src={formData.profile_picture_url || undefined} />
              <AvatarFallback className="text-3xl font-display bg-accent text-accent-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="text-muted-foreground">{formData.position || 'Employee'}</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                <Badge variant="secondary">{profile?.employee_id}</Badge>
                <Badge className={profile?.role === 'admin' ? 'bg-accent' : 'bg-info'}>
                  {profile?.role === 'admin' ? 'Admin' : 'Employee'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg">Personal Information</CardTitle>
            <CardDescription>
              {isAdmin
                ? 'You can edit all fields as an admin'
                : 'You can edit your phone, address, and profile picture'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                  <Input
                    id="profile_picture_url"
                    value={formData.profile_picture_url}
                    onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {infoItems.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-lg">Job Details</CardTitle>
            <CardDescription>
              {isAdmin ? 'Manage employment information' : 'Your employment details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing && isAdmin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {infoItems.slice(4).map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
