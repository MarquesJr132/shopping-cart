import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Database, Download, Upload } from "lucide-react";
import { getMovements, saveMovement } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import * as XLSX from 'xlsx';

export const DatabaseDebug = () => {
  const { toast } = useToast();
  const [movements, setMovements] = useState(getMovements());

  const handleClearData = () => {
    localStorage.removeItem('materialMovements');
    setMovements([]);
    toast({
      title: "Data cleared",
      description: "All movements have been removed from local storage",
    });
  };

  const handleRefresh = () => {
    const freshMovements = getMovements();
    setMovements(freshMovements);
    toast({
      title: "Data refreshed",
      description: `Found ${freshMovements.length} movements`,
    });
  };

  const handleExport = () => {
    // Prepare data for Excel
    const excelData = movements.map(movement => ({
      'Journal Number': movement.journalNumber,
      'Journal Name': movement.journalName,
      'Date': movement.date,
      'Status': movement.status,
      'Reason': movement.reason,
      'Client Name': movement.clientName || '',
      'Client ID': movement.clientId || '',
      'Requested By': movement.requestedByName,
      'Requested At': new Date(movement.requestedAt).toLocaleString(),
      'Items Count': movement.items.length,
      'Manager Approved By': movement.managerApproval?.approverName || '',
      'Manager Approved At': movement.managerApproval?.approvedAt ? new Date(movement.managerApproval.approvedAt).toLocaleString() : '',
      'Final Approved By': movement.finalApproval?.approverName || '',
      'Final Approved At': movement.finalApproval?.approvedAt ? new Date(movement.finalApproval.approvedAt).toLocaleString() : '',
      'Warehouse Completed By': movement.warehouseCompletion?.completedByName || '',
      'Warehouse Completed At': movement.warehouseCompletion?.completedAt ? new Date(movement.warehouseCompletion.completedAt).toLocaleString() : '',
      'Rejection Reason': movement.rejectionReason || ''
    }));

    // Create items sheet
    const itemsData = movements.flatMap(movement => 
      movement.items.map(item => ({
        'Journal Number': movement.journalNumber,
        'Item Code': item.itemCode,
        'Description': item.description,
        'Quantity': item.quantity,
        'Unit': item.unit,
        'Batch Number': item.batchNumber,
        'Cost Center': item.costCenter,
        'Internal Cost Center': item.internalCostCenter,
        'Movement Type': item.movementType
      }))
    );

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    const wsMovements = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, wsMovements, "Movements");
    
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, "Items");

    // Generate Excel file
    XLSX.writeFile(wb, `sika_material_movements_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Data exported",
      description: "Movements data downloaded as Excel file",
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Debug ({movements.length} movements)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleClearData} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>LocalStorage Key: materialMovements</p>
          <p>Total Movements: {movements.length}</p>
          <p>Data Size: {JSON.stringify(movements).length} characters</p>
        </div>

        {movements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Recent Movements:</h4>
            {movements.slice(0, 3).map(movement => (
              <div key={movement.id} className="text-xs p-2 bg-muted rounded">
                <p><strong>{movement.journalNumber}</strong> - {movement.status}</p>
                <p>By: {movement.requestedByName} | Items: {movement.items.length}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};