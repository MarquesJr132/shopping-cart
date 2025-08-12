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
import { getCurrentUser, isAdmin, getAllUsers, saveUser, deleteUser, User } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export const Admin = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    name: '',
    role: 'requester' as User['role'],
    costCenter: '',
    managerId: ''
  });

  useEffect(() => {
    if (!user || !isAdmin(user.id)) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      email: '',
      name: '',
      role: 'requester',
      costCenter: '',
      managerId: ''
    });
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData(prev => ({ ...prev, id: Date.now().toString() }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      id: userToEdit.id,
      email: userToEdit.email,
      name: userToEdit.name,
      role: userToEdit.role,
      costCenter: userToEdit.costCenter,
      managerId: userToEdit.managerId || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.email || !formData.name || !formData.costCenter) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      id: formData.id,
      email: formData.email,
      name: formData.name,
      role: formData.role,
      costCenter: formData.costCenter,
      managerId: formData.managerId || undefined
    };

    try {
      saveUser(newUser);
      loadUsers(); // Reload users immediately after saving
      setIsDialogOpen(false);
      resetForm();

      toast({
        title: editingUser ? "User updated" : "User created",
        description: `${newUser.name} has been ${editingUser ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save user. Please try again.",
        variant: "destructive",
      });
    }

  };

  const handleDelete = (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      try {
        deleteUser(userId);
        loadUsers(); // Reload users immediately after deletion
        toast({
          title: "User deleted",
          description: "User has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getManagerOptions = () => {
    return users.filter(u => 
      u.role === 'manager' || 
      u.role === 'sales_manager' || 
      u.role === 'general_manager'
    );
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'None';
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : 'Unknown';
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      'requester': 'secondary',
      'sales_requester': 'secondary',
      'manager': 'default',
      'sales_manager': 'default',
      'general_manager': 'destructive',
      'controller': 'outline',
      'procurement': 'outline'
    } as const;
    return variants[role as keyof typeof variants] || 'secondary';
  };

  if (!user || !isAdmin(user.id)) return null;

  return (
    <div className="min-h-screen bg-background">
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email*</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="user@mz.sika.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Full Name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role*</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as User['role'] }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requester">Requester</SelectItem>
                      <SelectItem value="sales_requester">Sales Requester</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="general_manager">General Manager</SelectItem>
                      <SelectItem value="controller">Controller</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="costCenter" className="text-right">Cost Center*</Label>
                  <Input
                    id="costCenter"
                    value={formData.costCenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, costCenter: e.target.value }))}
                    className="col-span-3"
                    placeholder="CC001"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="manager" className="text-right">Manager</Label>
                  <Select 
                    value={formData.managerId || "none"} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {getManagerOptions().map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.role.replace('_', ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingUser ? 'Update' : 'Create'}
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
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userItem) => (
                <div 
                  key={userItem.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{userItem.name}</h3>
                      <Badge variant={getRoleBadgeVariant(userItem.role)}>
                        {userItem.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {userItem.id === user.id && (
                        <Badge variant="outline" className="text-xs">YOU</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{userItem.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>Cost Center: {userItem.costCenter}</span>
                      <span>Manager: {getManagerName(userItem.managerId)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(userItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userItem.id !== user.id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(userItem.id)}
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