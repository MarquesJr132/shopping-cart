import { useState, useEffect } from "react";
import { Plus, FileText, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import { getMovements, MaterialMovement } from "@/lib/database";
import { initializeSampleData } from "@/lib/sampleData";
import { Header } from "@/components/Header";
import { DatabaseDebug } from "@/components/DatabaseDebug";
import { QuickActions } from "@/components/QuickActions";
import { ActivityFeed } from "@/components/ActivityFeed";

export const Dashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [movements, setMovements] = useState<MaterialMovement[]>([]);

  useEffect(() => {
    // Initialize sample data first
    initializeSampleData();
    
    // Get fresh movements data
    const allMovements = getMovements();
    setMovements(allMovements);
    console.log('Dashboard loaded with movements:', allMovements);
  }, []);

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'secondary',
      'pending_manager_approval': 'warning',
      'pending_final_approval': 'warning',
      'approved': 'success',
      'rejected': 'destructive',
      'completed': 'default'
    } as const;

    const labels = {
      'draft': 'Draft',
      'pending_manager_approval': 'Pending Manager',
      'pending_final_approval': 'Pending Final',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStats = () => {
    const userMovements = movements.filter(m => 
      m.requestedBy === user.id || 
      (user.role === 'procurement' && m.status === 'approved')
    );

    return {
      total: userMovements.length,
      pending: userMovements.filter(m => 
        m.status === 'pending_manager_approval' || 
        m.status === 'pending_final_approval'
      ).length,
      approved: userMovements.filter(m => m.status === 'approved').length,
      completed: userMovements.filter(m => m.status === 'completed').length,
    };
  };

  const canCreateMovement = () => {
    return user.role === 'requester' || user.role === 'sales_requester';
  };

  const getFilteredMovements = () => {
    if (user.role === 'procurement') {
      return movements.filter(m => m.status === 'approved' || m.status === 'completed');
    }
    
    if (user.role === 'manager' || user.role === 'sales_manager') {
      return movements.filter(m => 
        m.requestedBy === user.id || 
        m.status === 'pending_manager_approval' ||
        (m.managerApproval?.approvedBy === user.id)
      );
    }
    
    if (user.role === 'general_manager' || user.role === 'controller') {
      return movements.filter(m => 
        m.requestedBy === user.id || 
        m.status === 'pending_final_approval' ||
        (m.finalApproval?.approvedBy === user.id)
      );
    }
    
    return movements.filter(m => m.requestedBy === user.id);
  };

  const stats = getStats();
  const filteredMovements = getFilteredMovements();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your material movements</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => navigate('/movement/new?type=shopping_card')} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Shopping Card</span>
            </Button>
            {canCreateMovement() && (
              <Button onClick={() => navigate('/movement/new')} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Material Movement</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No movements found</p>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/movement/new?type=shopping_card')}
                  >
                    Create Shopping Card
                  </Button>
                  {canCreateMovement() && (
                    <Button 
                      onClick={() => navigate('/movement/new')}
                    >
                      Create Material Movement
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMovements.slice(0, 10).map((movement) => (
                  <div 
                    key={movement.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/movement/${movement.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{movement.journalNumber}</h3>
                        {getStatusBadge(movement.status)}
                        {movement.requestType === 'shopping_card' && (
                          <Badge variant="outline" className="text-xs">Shopping Card</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{movement.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {movement.requestedByName} on {new Date(movement.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {movement.items.length} item{movement.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions onMovementUpdate={() => {
            const allMovements = getMovements();
            setMovements(allMovements);
          }} />
          
          <ActivityFeed />
        </div>

        {/* Debug Component - Remove in production */}
        <DatabaseDebug />
      </div>
    </div>
  );
};