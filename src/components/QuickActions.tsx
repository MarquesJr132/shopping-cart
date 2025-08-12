import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Calendar, FileText, CheckCircle, XCircle } from "lucide-react";
import { MaterialMovement, getMovementById, saveMovement } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onMovementUpdate?: () => void;
}

export const QuickActions = ({ onMovementUpdate }: QuickActionsProps) => {
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [comments, setComments] = useState("");
  const [notes, setNotes] = useState("");
  const user = getCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    // Get movements that need attention based on user role
    const allMovements = JSON.parse(localStorage.getItem('materialMovements') || '[]');
    let filteredMovements: MaterialMovement[] = [];

    if (user?.role === 'manager' || user?.role === 'sales_manager') {
      filteredMovements = allMovements.filter((m: MaterialMovement) => 
        m.status === 'pending_manager_approval'
      );
    } else if (user?.role === 'general_manager' || user?.role === 'controller') {
      filteredMovements = allMovements.filter((m: MaterialMovement) => 
        m.status === 'pending_final_approval'
      );
    } else if (user?.role === 'procurement') {
      filteredMovements = allMovements.filter((m: MaterialMovement) => 
        m.status === 'approved'
      );
    }

    setMovements(filteredMovements);
  }, [user]);

  const handleQuickAction = async () => {
    if (!selectedMovement || !action || !user) {
      toast({
        title: "Missing information",
        description: "Please select a movement and action",
        variant: "destructive"
      });
      return;
    }

    const movement = getMovementById(selectedMovement);
    if (!movement) {
      toast({
        title: "Movement not found",
        description: "The selected movement could not be found",
        variant: "destructive"
      });
      return;
    }

    try {
      if (action === 'approve_manager' && (user.role === 'manager' || user.role === 'sales_manager')) {
        movement.status = 'pending_final_approval';
        movement.managerApproval = {
          approvedBy: user.id,
          approverName: user.name,
          approverRole: user.role,
          approvedAt: new Date().toISOString(),
          comments: comments || 'Quick approval'
        };
      } else if (action === 'approve_final' && (user.role === 'general_manager' || user.role === 'controller')) {
        movement.status = 'approved';
        movement.finalApproval = {
          approvedBy: user.id,
          approverName: user.name,
          approverRole: user.role,
          approvedAt: new Date().toISOString(),
          comments: comments || 'Final approval'
        };
      } else if (action === 'complete_warehouse' && user.role === 'procurement') {
        movement.status = 'completed';
        movement.warehouseCompletion = {
          completedBy: user.id,
          completedByName: user.name,
          completedAt: new Date().toISOString(),
          notes: notes || 'Warehouse processing completed'
        };
      } else if (action === 'reject') {
        movement.status = 'rejected';
        movement.rejectionReason = comments || 'Quick rejection';
      }

      saveMovement(movement);
      
      // Reset form
      setSelectedMovement("");
      setAction("");
      setComments("");
      setNotes("");
      
      // Refresh movements list
      const updatedMovements = movements.filter(m => m.id !== selectedMovement);
      setMovements(updatedMovements);
      
      onMovementUpdate?.();

      toast({
        title: "Action completed",
        description: `Movement ${movement.journalNumber} has been ${action.replace('_', ' ')}d`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the action",
        variant: "destructive"
      });
    }
  };

  const getAvailableActions = () => {
    if (user?.role === 'manager' || user?.role === 'sales_manager') {
      return [
        { value: 'approve_manager', label: 'Approve as Manager' },
        { value: 'reject', label: 'Reject' }
      ];
    } else if (user?.role === 'general_manager' || user?.role === 'controller') {
      return [
        { value: 'approve_final', label: 'Final Approval' },
        { value: 'reject', label: 'Reject' }
      ];
    } else if (user?.role === 'procurement') {
      return [
        { value: 'complete_warehouse', label: 'Complete Processing' }
      ];
    }
    return [];
  };

  const selectedMovementDetails = movements.find(m => m.id === selectedMovement);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Quick Actions ({movements.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending actions for your role</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="movement-select">Select Movement</Label>
              <Select value={selectedMovement} onValueChange={setSelectedMovement}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a movement to process" />
                </SelectTrigger>
                <SelectContent>
                  {movements.map(movement => (
                    <SelectItem key={movement.id} value={movement.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{movement.journalNumber}</span>
                        <Badge variant="outline">{movement.status.replace('_', ' ')}</Badge>
                        <span className="text-sm text-muted-foreground">
                          by {movement.requestedByName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMovementDetails && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedMovementDetails.journalNumber}</span>
                  <Badge>{selectedMovementDetails.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedMovementDetails.reason}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {selectedMovementDetails.requestedByName}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(selectedMovementDetails.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    {selectedMovementDetails.items.length} items
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="action-select">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an action" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableActions().map(actionOption => (
                    <SelectItem key={actionOption.value} value={actionOption.value}>
                      {actionOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {action && (
              <>
                <Separator />
                
                {action !== 'complete_warehouse' ? (
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      placeholder="Add comments for this action..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Warehouse Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add completion notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <Button 
                  onClick={handleQuickAction}
                  className="w-full"
                  disabled={!selectedMovement || !action}
                >
                  {action === 'reject' ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Execute Action
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};