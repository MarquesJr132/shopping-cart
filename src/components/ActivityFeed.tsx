import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { getMovements, MaterialMovement } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayActions: 0,
    weekActions: 0,
    avgProcessingTime: 0,
    pendingCount: 0
  });
  const user = getCurrentUser();

  useEffect(() => {
    const movements = getMovements();
    
    // Generate activity feed from movements
    const activityFeed: any[] = [];
    
    movements.forEach(movement => {
      // Add creation activity
      activityFeed.push({
        id: `${movement.id}-created`,
        type: 'created',
        title: 'Movement Created',
        description: `${movement.journalNumber} was created`,
        user: movement.requestedByName,
        timestamp: movement.requestedAt,
        status: movement.status,
        movementId: movement.id
      });

      // Add manager approval activity
      if (movement.managerApproval) {
        activityFeed.push({
          id: `${movement.id}-manager-approved`,
          type: 'approved',
          title: 'Manager Approval',
          description: `${movement.journalNumber} approved by manager`,
          user: movement.managerApproval.approverName,
          timestamp: movement.managerApproval.approvedAt,
          status: movement.status,
          movementId: movement.id
        });
      }

      // Add final approval activity
      if (movement.finalApproval) {
        activityFeed.push({
          id: `${movement.id}-final-approved`,
          type: 'approved',
          title: 'Final Approval',
          description: `${movement.journalNumber} received final approval`,
          user: movement.finalApproval.approverName,
          timestamp: movement.finalApproval.approvedAt,
          status: movement.status,
          movementId: movement.id
        });
      }

      // Add warehouse completion activity
      if (movement.warehouseCompletion) {
        activityFeed.push({
          id: `${movement.id}-completed`,
          type: 'completed',
          title: 'Warehouse Completion',
          description: `${movement.journalNumber} processing completed`,
          user: movement.warehouseCompletion.completedByName,
          timestamp: movement.warehouseCompletion.completedAt,
          status: movement.status,
          movementId: movement.id
        });
      }

      // Add rejection activity
      if (movement.status === 'rejected') {
        activityFeed.push({
          id: `${movement.id}-rejected`,
          type: 'rejected',
          title: 'Movement Rejected',
          description: `${movement.journalNumber} was rejected`,
          user: 'System',
          timestamp: movement.requestedAt, // Fallback timestamp
          status: movement.status,
          movementId: movement.id
        });
      }
    });

    // Sort by timestamp (newest first)
    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(activityFeed);

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayActions = activityFeed.filter(activity => 
      new Date(activity.timestamp) >= today
    ).length;

    const weekActions = activityFeed.filter(activity => 
      new Date(activity.timestamp) >= weekAgo
    ).length;

    const pendingCount = movements.filter(m => 
      m.status === 'pending_manager_approval' || 
      m.status === 'pending_final_approval'
    ).length;

    // Simple average processing time calculation (in days)
    const completedMovements = movements.filter(m => m.status === 'completed');
    let avgProcessingTime = 0;
    
    if (completedMovements.length > 0) {
      const totalTime = completedMovements.reduce((sum, movement) => {
        const created = new Date(movement.requestedAt);
        const completed = new Date(movement.warehouseCompletion?.completedAt || created);
        return sum + (completed.getTime() - created.getTime());
      }, 0);
      
      avgProcessingTime = Math.round(totalTime / (completedMovements.length * 24 * 60 * 60 * 1000));
    }

    setStats({
      todayActions,
      weekActions,
      avgProcessingTime,
      pendingCount
    });

  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Activity & Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <ScrollArea className="h-[400px] w-full">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <Badge variant={getStatusBadgeVariant(activity.status)} className="text-xs">
                            {activity.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.todayActions}</div>
                <div className="text-sm text-muted-foreground">Actions Today</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.weekActions}</div>
                <div className="text-sm text-muted-foreground">Actions This Week</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.avgProcessingTime}d</div>
                <div className="text-sm text-muted-foreground">Avg Processing Time</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-warning">{stats.pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending Approval</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Connection</span>
                  <Badge variant="default" className="bg-green-500">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Sync</span>
                  <span className="text-sm text-muted-foreground">Real-time</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Movements</span>
                  <span className="text-sm font-medium">{getMovements().length}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};