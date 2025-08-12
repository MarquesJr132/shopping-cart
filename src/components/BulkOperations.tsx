import { useState } from "react";
import { Trash2, CheckCircle, XCircle, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MaterialMovement, deleteMovement, saveMovement } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import * as XLSX from 'xlsx';

interface BulkOperationsProps {
  movements: MaterialMovement[];
  onMovementsChange: () => void;
}

export const BulkOperations = ({ movements, onMovementsChange }: BulkOperationsProps) => {
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const { toast } = useToast();
  const user = getCurrentUser();

  const handleSelectAll = () => {
    if (selectedMovements.length === movements.length) {
      setSelectedMovements([]);
    } else {
      setSelectedMovements(movements.map(m => m.id));
    }
  };

  const handleSelectMovement = (movementId: string) => {
    setSelectedMovements(prev => 
      prev.includes(movementId) 
        ? prev.filter(id => id !== movementId)
        : [...prev, movementId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedMovements.length === 0) return;

    selectedMovements.forEach(id => {
      deleteMovement(id);
    });

    setSelectedMovements([]);
    onMovementsChange();

    toast({
      title: "Movements deleted",
      description: `${selectedMovements.length} movements have been deleted`,
    });
  };

  const handleBulkApproval = (action: 'approve' | 'reject') => {
    if (selectedMovements.length === 0) return;

    const updatedCount = selectedMovements.reduce((count, id) => {
      const movement = movements.find(m => m.id === id);
      if (!movement) return count;

      let updated = false;

      if (action === 'approve') {
        if (movement.status === 'pending_manager_approval' && (user?.role === 'manager' || user?.role === 'sales_manager')) {
          movement.status = 'pending_final_approval';
          movement.managerApproval = {
            approvedBy: user.id,
            approverName: user.name,
            approverRole: user.role,
            approvedAt: new Date().toISOString(),
            comments: 'Bulk approval'
          };
          updated = true;
        } else if (movement.status === 'pending_final_approval' && (user?.role === 'general_manager' || user?.role === 'controller')) {
          movement.status = 'approved';
          movement.finalApproval = {
            approvedBy: user.id,
            approverName: user.name,
            approverRole: user.role,
            approvedAt: new Date().toISOString(),
            comments: 'Bulk approval'
          };
          updated = true;
        }
      } else if (action === 'reject') {
        if ((movement.status === 'pending_manager_approval' && (user?.role === 'manager' || user?.role === 'sales_manager')) ||
            (movement.status === 'pending_final_approval' && (user?.role === 'general_manager' || user?.role === 'controller'))) {
          movement.status = 'rejected';
          movement.rejectionReason = 'Bulk rejection';
          updated = true;
        }
      }

      if (updated) {
        saveMovement(movement);
        return count + 1;
      }
      return count;
    }, 0);

    setSelectedMovements([]);
    onMovementsChange();

    toast({
      title: `Movements ${action}d`,
      description: `${updatedCount} movements have been ${action}d`,
    });
  };

  const exportToExcel = () => {
    if (selectedMovements.length === 0) {
      toast({
        title: "No selections",
        description: "Please select movements to export",
        variant: "destructive"
      });
      return;
    }

    const selectedData = movements.filter(m => selectedMovements.includes(m.id));
    
    // Prepare data for Excel
    const excelData = selectedData.map(movement => ({
      'Journal Number': movement.journalNumber,
      'Date': movement.date,
      'Status': movement.status,
      'Reason': movement.reason,
      'Requested By': movement.requestedByName,
      'Client Name': movement.clientName || '',
      'Items Count': movement.items.length,
      'Manager Approved': movement.managerApproval?.approverName || '',
      'Final Approved': movement.finalApproval?.approverName || '',
      'Warehouse Completed': movement.warehouseCompletion?.completedByName || ''
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movements");

    // Generate Excel file
    XLSX.writeFile(wb, `material_movements_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export successful",
      description: `${selectedMovements.length} movements exported to Excel`,
    });
  };

  const canBulkApprove = user?.role === 'manager' || user?.role === 'sales_manager' || user?.role === 'general_manager' || user?.role === 'controller';
  const canBulkDelete = user?.role === 'general_manager' || user?.role === 'controller';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Operations</span>
          <span className="text-sm font-normal text-muted-foreground">
            {selectedMovements.length} selected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {movements.length === 0 ? (
          <Alert>
            <AlertDescription>No movements available for bulk operations.</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Selection Controls */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedMovements.length === movements.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">Select All ({movements.length} movements)</span>
            </div>

            {/* Movement List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {movements.map(movement => (
                <div key={movement.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    checked={selectedMovements.includes(movement.id)}
                    onCheckedChange={() => handleSelectMovement(movement.id)}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{movement.journalNumber}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{movement.status}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{movement.requestedByName}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                disabled={selectedMovements.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>

              {canBulkApprove && (
                <>
                  <Button 
                    onClick={() => handleBulkApproval('approve')}
                    variant="default"
                    size="sm"
                    disabled={selectedMovements.length === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bulk Approve
                  </Button>

                  <Button 
                    onClick={() => handleBulkApproval('reject')}
                    variant="outline"
                    size="sm"
                    disabled={selectedMovements.length === 0}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Bulk Reject
                  </Button>
                </>
              )}

              {canBulkDelete && (
                <Button 
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  disabled={selectedMovements.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};