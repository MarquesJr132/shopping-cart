import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getShoppingRequests, updateShoppingRequest } from "@/lib/supabase";
import type { ShoppingRequestWithItems } from "@/lib/supabase";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ShoppingRequestWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (profile) {
      loadRequests();
    }
  }, [profile]);

  const loadRequests = async () => {
    try {
      const data = await getShoppingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, additionalData?: any) => {
    try {
      await updateShoppingRequest(requestId, { 
        status: newStatus,
        ...additionalData
      });
      
      await loadRequests();
      toast({
        title: "Success",
        description: "Request status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    }
  };

  if (!profile) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'secondary',
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'destructive',
      'completed': 'default',
      'cancelled': 'secondary'
    } as const;

    const labels = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending_approval').length,
      approved: requests.filter(r => r.status === 'approved').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Shopping Cart Dashboard</h1>
            <p className="text-muted-foreground">Manage your shopping requests</p>
          </div>
          
          <Button onClick={() => navigate('/request/new')} className="flex items-center space-x-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Requests</CardTitle>
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-success">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Completed</CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No requests found</p>
                <Button 
                  onClick={() => navigate('/request/new')}
                  className="mt-4"
                >
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 10).map((request) => (
                  <div 
                    key={request.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer space-y-2 md:space-y-0"
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm md:text-base truncate">{request.request_number}</h3>
                        {getStatusBadge(request.status)}
                        <Badge variant="outline" className="text-xs">
                          {request.request_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.justification || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {request.requester.full_name} on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex-shrink-0 text-right md:text-left">
                      {request.request_items?.length || 0} item{(request.request_items?.length || 0) !== 1 ? 's' : ''}
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
};