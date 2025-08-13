import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getAllProfiles, updateProfile, createProfile } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/supabase";

export const Admin = () => {
  console.log('🔥 ADMIN COMPONENT CALLED - START OF FUNCTION');
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    full_name: string;
    password: string;
    role: 'user' | 'manager' | 'admin' | 'procurement';
    manager_id: string;
    cost_center: string;
  }>({
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    manager_id: '',
    cost_center: ''
  });

  useEffect(() => {
    console.log('Admin useEffect - profile:', profile);
    if (!profile || profile.role !== 'admin') {
      console.log('Admin access denied - redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    console.log('Admin access granted - loading profiles');
    loadProfiles();
  }, [profile, navigate]);

  const loadProfiles = async () => {
    try {
      console.log('Loading profiles...');
      console.log('Supabase client:', supabase);
      console.log('getAllProfiles function:', getAllProfiles);
      
      const data = await getAllProfiles();
      console.log('Profiles loaded successfully:', data);
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles - detailed:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      toast({
        title: "Error",
        description: `Failed to load users: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      // Set empty array so the component still renders
      setProfiles([]);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'user',
      manager_id: '',
      cost_center: ''
    });
    setEditingProfile(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (userToEdit: Profile) => {
    setEditingProfile(userToEdit);
    setFormData({
      email: userToEdit.email,
      full_name: userToEdit.full_name,
      password: '', // Don't pre-fill password for security
      role: userToEdit.role,
      manager_id: userToEdit.manager_id || '',
      cost_center: userToEdit.cost_center || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.email || !formData.full_name) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!editingProfile && !formData.password) {
      toast({
        title: "Missing password",
        description: "Please provide a password for the new user.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editingProfile) {
        // Update existing profile
        await updateProfile(editingProfile.id, {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          manager_id: formData.manager_id || null,
          cost_center: formData.cost_center || null
        });
        toast({
          title: "User updated",
          description: `${formData.full_name} has been updated successfully.`,
        });
      } else {
        // Create new user using Edge Function
        const { data: createResult, error: createError } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            manager_id: formData.manager_id || undefined,
            cost_center: formData.cost_center || undefined
          }
        })

        if (createError) {
          throw createError
        }

        if (!createResult?.success) {
          throw new Error(createResult?.error || 'Failed to create user')
        }

        toast({
          title: "User created",
          description: `${formData.full_name} has been created successfully.`,
        });
      }

      await loadProfiles();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userProfile: Profile) => {
    if (userProfile.id === profile?.id) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      // Delete user from Supabase Auth (this will cascade to profiles table)
      const { error } = await supabase.auth.admin.deleteUser(userProfile.user_id);
      
      if (error) {
        throw error;
      }

      await loadProfiles();
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getManagerOptions = () => {
    return profiles.filter(u => 
      u.role === 'manager' || u.role === 'procurement'
    );
  };

  const getManagerName = (managerId?: string | null) => {
    if (!managerId) return 'None';
    const manager = profiles.find(u => u.id === managerId);
    return manager ? manager.full_name : 'Unknown';
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      'user': 'secondary',
      'manager': 'default',
      'admin': 'destructive',
      'procurement': 'outline'
    } as const;
    return variants[role as keyof typeof variants] || 'secondary';
  };

  console.log('Admin render - profiles count:', profiles.length);
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  if (authLoading) {
    console.log('Admin: Still loading auth...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    console.log('Admin: No profile or not admin, profile:', profile);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div style={{backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold'}}>
        🔧 DEBUG: ADMIN PAGE LOADING - PROFILES: {profiles.length} | URL: {window.location.pathname}
      </div>
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Administration</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" aria-describedby="user-form-description">
              <DialogHeader>
                <DialogTitle>{editingProfile ? 'Edit User' : 'Create New User'}</DialogTitle>
                <p id="user-form-description" className="text-sm text-muted-foreground">
                  {editingProfile ? 'Update user information and permissions.' : 'Create a new user account with email and password.'}
                </p>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email*</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="user@company.com"
                    disabled={!!editingProfile}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name*</Label>
                  <Input
                    id="name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Full Name"
                  />
                </div>
                {!editingProfile && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password*</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="col-span-3"
                      placeholder="User password"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role*</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager" className="text-right">Manager</Label>
                  <Select 
                    value={formData.manager_id || "none"} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {getManagerOptions().map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name} ({manager.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost_center" className="text-right">Cost Center</Label>
                  <Input
                    id="cost_center"
                    value={formData.cost_center}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_center: e.target.value }))}
                    className="col-span-3"
                    placeholder="Cost center code"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingProfile ? 'Update' : 'Create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users ({profiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profiles.map((userProfile) => (
                <div 
                  key={userProfile.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{userProfile.full_name}</h3>
                      <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                        {userProfile.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {userProfile.id === profile.id && (
                        <Badge variant="outline" className="text-xs">YOU</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>Manager: {getManagerName(userProfile.manager_id)}</span>
                      <span>Cost Center: {userProfile.cost_center || 'Not assigned'}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(userProfile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userProfile.id !== profile.id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(userProfile)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};