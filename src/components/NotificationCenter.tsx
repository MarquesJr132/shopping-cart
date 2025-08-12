import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMovements, MaterialMovement } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

interface Notification {
  id: string;
  type: 'approval_needed' | 'approved' | 'rejected' | 'completed';
  title: string;
  message: string;
  timestamp: string;
  movementId: string;
  read: boolean;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) return;

    const movements = getMovements();
    const newNotifications: Notification[] = [];

    movements.forEach(movement => {
      // Notifications for managers about pending approvals
      if ((user.role === 'manager' || user.role === 'sales_manager') && 
          movement.status === 'pending_manager_approval') {
        newNotifications.push({
          id: `${movement.id}-manager-approval`,
          type: 'approval_needed',
          title: 'Approval Required',
          message: `Movement ${movement.journalNumber} needs your approval`,
          timestamp: movement.requestedAt,
          movementId: movement.id,
          read: false
        });
      }

      // Notifications for final approvers
      if ((user.role === 'general_manager' || user.role === 'controller') && 
          movement.status === 'pending_final_approval') {
        newNotifications.push({
          id: `${movement.id}-final-approval`,
          type: 'approval_needed',
          title: 'Final Approval Required',
          message: `Movement ${movement.journalNumber} needs final approval`,
          timestamp: movement.managerApproval?.approvedAt || movement.requestedAt,
          movementId: movement.id,
          read: false
        });
      }

      // Notifications for warehouse staff about approved movements
      if (user.role === 'procurement' && movement.status === 'approved') {
        newNotifications.push({
          id: `${movement.id}-warehouse`,
          type: 'approval_needed',
          title: 'Ready for Processing',
          message: `Movement ${movement.journalNumber} is ready for warehouse processing`,
          timestamp: movement.finalApproval?.approvedAt || movement.requestedAt,
          movementId: movement.id,
          read: false
        });
      }

      // Notifications for requesters about status changes
      if (movement.requestedBy === user.id) {
        if (movement.status === 'approved' && movement.finalApproval) {
          newNotifications.push({
            id: `${movement.id}-approved`,
            type: 'approved',
            title: 'Movement Approved',
            message: `Your movement ${movement.journalNumber} has been approved`,
            timestamp: movement.finalApproval.approvedAt,
            movementId: movement.id,
            read: false
          });
        }

        if (movement.status === 'rejected') {
          newNotifications.push({
            id: `${movement.id}-rejected`,
            type: 'rejected',
            title: 'Movement Rejected',
            message: `Your movement ${movement.journalNumber} has been rejected`,
            timestamp: new Date().toISOString(),
            movementId: movement.id,
            read: false
          });
        }

        if (movement.status === 'completed' && movement.warehouseCompletion) {
          newNotifications.push({
            id: `${movement.id}-completed`,
            type: 'completed',
            title: 'Movement Completed',
            message: `Your movement ${movement.journalNumber} has been completed`,
            timestamp: movement.warehouseCompletion.completedAt,
            movementId: movement.id,
            read: false
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setNotifications(newNotifications);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approval_needed':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <X className="h-4 w-4 text-destructive" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};