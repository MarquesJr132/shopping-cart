import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Edit, 
  FileText, 
  User, 
  Calendar,
  Package
} from "lucide-react";
import { Header } from "@/components/Header";
import { getCurrentUser, canApprove, canComplete, canReject, getAllUsers } from "@/lib/auth";
import { getMovementById, saveMovement, MaterialMovement } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export const MovementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { toast } = useToast();
  const [movement, setMovement] = useState<MaterialMovement | null>(null);
  const [comments, setComments] = useState("");
  const [warehouseNotes, setWarehouseNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      const foundMovement = getMovementById(id);
      if (foundMovement) {
        setMovement(foundMovement);
      } else {
        toast({
          title: "Movement not found",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    }
  }, [user, id, navigate, toast]);

  const handleApprove = () => {
    if (!movement || !user) return;

    const updatedMovement = { ...movement };
    
    if (movement.status === 'pending_manager_approval') {
      updatedMovement.managerApproval = {
        approvedBy: user.id,
        approverName: user.name,
        approverRole: user.role,
        approvedAt: new Date().toISOString(),
        comments: comments.trim() || undefined,
      };
      // For shopping card requests, manager approval is final
      updatedMovement.status = movement.requestType === 'shopping_card' ? 'approved' : 'pending_final_approval';
    } else if (movement.status === 'pending_final_approval') {
      updatedMovement.finalApproval = {
        approvedBy: user.id,
        approverName: user.name,
        approverRole: user.role,
        approvedAt: new Date().toISOString(),
        comments: comments.trim() || undefined,
      };
      updatedMovement.status = 'approved';
    }

    saveMovement(updatedMovement);
    setMovement(updatedMovement);
    setComments("");

    toast({
      title: "Movement approved",
      description: "The movement has been approved successfully.",
    });
  };

  const handleReject = () => {
    if (!movement || !user || !comments.trim()) {
      toast({
        title: "Comments required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    const updatedMovement = { 
      ...movement, 
      status: 'rejected' as const,
      rejectionReason: comments.trim()
    };

    saveMovement(updatedMovement);
    setMovement(updatedMovement);
    setComments("");

    toast({
      title: "Movement rejected",
      description: "The movement has been rejected.",
      variant: "destructive",
    });
  };

  const handleComplete = () => {
    if (!movement || !user) return;

    const updatedMovement = { 
      ...movement,
      status: 'completed' as const,
      warehouseCompletion: {
        completedBy: user.id,
        completedByName: user.name,
        completedAt: new Date().toISOString(),
        notes: warehouseNotes.trim() || undefined,
      }
    };

    saveMovement(updatedMovement);
    setMovement(updatedMovement);
    setWarehouseNotes("");

    toast({
      title: "Movement completed",
      description: "The warehouse operation has been completed.",
    });
  };

  const handleProcurementReject = () => {
    if (!movement || !user || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    const updatedMovement = { 
      ...movement, 
      status: 'rejected' as const,
      rejectionReason: rejectionReason.trim()
    };

    saveMovement(updatedMovement);
    setMovement(updatedMovement);
    setRejectionReason("");

    toast({
      title: "Movement rejected",
      description: "The movement has been rejected by procurement.",
      variant: "destructive",
    });
  };

  const handleCancel = () => {
    if (!movement || !user) return;

    const updatedMovement = { 
      ...movement, 
      status: 'rejected' as const,
      rejectionReason: "Cancelled by requester"
    };

    saveMovement(updatedMovement);
    setMovement(updatedMovement);

    toast({
      title: "Movement cancelled",
      description: "The movement has been cancelled.",
      variant: "destructive",
    });
  };

  if (!user || !movement) return null;

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
      'pending_manager_approval': 'Pending Manager Approval',
      'pending_final_approval': 'Pending Final Approval',
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

  const canUserApprove = canApprove(user.role, movement.status, movement.requestType);
  const canUserComplete = canComplete(user.role) && movement.status === 'approved';
  const canUserEdit = (movement.requestedBy === user.id && movement.status === 'draft');
  const canUserReject = canReject(user.role) && movement.requestType === 'shopping_card' && movement.status === 'approved';
  const canUserCancel = movement.requestedBy === user.id && (movement.status === 'approved' || movement.status === 'pending_manager_approval' || movement.status === 'pending_final_approval');

  const generatePDF = (movement: MaterialMovement): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = 25;

    // Helper function to add horizontal line
    const addLine = (yPos: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // Helper function to add section header - Compact
    const addSectionHeader = (title: string, yPos: number) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 6, 'F');
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 3, yPos + 2);
      return yPos + 10;
    };

    // Header - Compact
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER ATTACHMENT", pageWidth / 2, y, { align: "center" });
    
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sika Mozambique", pageWidth / 2, y, { align: "center" });
    
    y += 10;
    addLine(y);
    y += 8;
    
    doc.setFontSize(8);
    doc.text(`Document ID: ${movement.journalNumber}`, margin, y);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, pageWidth - margin, y, { align: "right" });
    
    y += 12;

    // Two-column layout for Requestor Information and Movement Details
    const leftColumnX = margin + 5;
    const rightColumnX = pageWidth / 2 + 10;
    
    // Requestor Information (Left Column) - Compact
    doc.setFillColor(240, 240, 240);
    doc.rect(leftColumnX - 5, y - 2, (pageWidth / 2) - 15, 6, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("REQUESTOR INFORMATION", leftColumnX - 2, y + 2);
    
    // Movement Details (Right Column) - Compact
    doc.setFillColor(240, 240, 240);
    doc.rect(rightColumnX - 5, y - 2, (pageWidth / 2) - 15, 6, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("MOVEMENT DETAILS", rightColumnX - 2, y + 2);
    
    y += 12;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const requestorUser = getAllUsers().find(u => u.id === movement.requestedBy);
    const requestorDetails = [
      ["Requested By:", movement.requestedByName],
      ["Cost Center:", requestorUser?.costCenter || 'N/A'],
      ["Request Date:", new Date(movement.requestedAt).toLocaleDateString('en-GB')],
      ["Description/Reason:", movement.reason || 'N/A']
    ];

    const details = [
      ["Journal Number:", movement.journalNumber],
      ["Journal Name:", movement.journalName],
      ["Request Type:", movement.requestType === 'shopping_card' ? 'Shopping Card' : 'Material Movement']
    ];

    if (movement.requestType === 'material_movement') {
      details.push(["Movement Date:", new Date(movement.date).toLocaleDateString('en-GB')]);
    }

    if (movement.requestType === 'shopping_card') {
      details.push(["Shopping Card Type:", movement.shoppingCardType || 'N/A']);
    }

    if (movement.clientName || movement.clientId) {
      details.push(["Client Information:", `${movement.clientName || 'N/A'}${movement.clientId ? ` (ID: ${movement.clientId})` : ''}`]);
    }

    // Find the maximum number of rows between both columns
    const maxRows = Math.max(requestorDetails.length, details.length);
    
    // Render both columns side by side - Compact
    for (let i = 0; i < maxRows; i++) {
      const currentY = y + (i * 4);
      
      // Left column (Requestor Information)
      if (i < requestorDetails.length) {
        const [label, value] = requestorDetails[i];
        doc.setFont("helvetica", "bold");
        doc.text(label, leftColumnX, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(value, leftColumnX + 32, currentY);
      }
      
      // Right column (Movement Details)
      if (i < details.length) {
        const [label, value] = details[i];
        doc.setFont("helvetica", "bold");
        doc.text(label, rightColumnX, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(value, rightColumnX + 32, currentY);
      }
    }

    y += (maxRows * 4) + 10;

    // Items Section
    y = addSectionHeader("ITEM DETAILS", y);

    // Simplified item layout for better space usage
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Header row
    doc.text("ITEM", margin + 5, y);
    doc.text("DESCRIPTION", margin + 25, y);
    doc.text("QTY", pageWidth - margin - 30, y, { align: "right" });
    
    y += 3;
    addLine(y);
    y += 8;
    
    // Items in compact format
    doc.setFont("helvetica", "normal");
    movement.items.forEach((item, index) => {
      const itemNum = `${index + 1}.`;
      const description = item.description || 'N/A';
      const quantity = `${item.quantity} ${item.unit}`;
      
      doc.setFont("helvetica", "bold");
      doc.text(itemNum, margin + 5, y);
      doc.setFont("helvetica", "normal");
      
      // Split description into multiple lines if too long
      const maxDescWidth = pageWidth - margin - 80;
      const descLines = doc.splitTextToSize(description, maxDescWidth);
      
      doc.text(descLines, margin + 25, y);
      doc.text(quantity, pageWidth - margin - 30, y, { align: "right" });
      
      y += Math.max(descLines.length * 4, 6);
    });

    y += 5;

    // Approvals Section
    y = addSectionHeader("APPROVAL WORKFLOW", y);

    interface ApprovalItem {
      title: string;
      name: string;
      date: string;
      time: string;
      status: string;
      comments?: string;
    }

    const approvals: ApprovalItem[] = [
      {
        title: "1. REQUESTED BY",
        name: movement.requestedByName,
        date: new Date(movement.requestedAt).toLocaleDateString('en-GB'),
        time: new Date(movement.requestedAt).toLocaleTimeString('en-GB'),
        status: "✓ Submitted"
      }
    ];

    if (movement.managerApproval) {
      approvals.push({
        title: "2. MANAGER APPROVAL",
        name: movement.managerApproval.approverName,
        date: new Date(movement.managerApproval.approvedAt).toLocaleDateString('en-GB'),
        time: new Date(movement.managerApproval.approvedAt).toLocaleTimeString('en-GB'),
        status: "✓ Approved",
        comments: movement.managerApproval.comments
      });
    }

    if (movement.finalApproval) {
      approvals.push({
        title: "3. FINAL APPROVAL",
        name: movement.finalApproval.approverName,
        date: new Date(movement.finalApproval.approvedAt).toLocaleDateString('en-GB'),
        time: new Date(movement.finalApproval.approvedAt).toLocaleTimeString('en-GB'),
        status: "✓ Approved",
        comments: movement.finalApproval.comments
      });
    }

    if (movement.warehouseCompletion) {
      approvals.push({
        title: "4. WAREHOUSE COMPLETION",
        name: movement.warehouseCompletion.completedByName,
        date: new Date(movement.warehouseCompletion.completedAt).toLocaleDateString('en-GB'),
        time: new Date(movement.warehouseCompletion.completedAt).toLocaleTimeString('en-GB'),
        status: "✓ Completed",
        comments: movement.warehouseCompletion.notes
      });
    }

    approvals.forEach((approval) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(approval.title, margin + 5, y);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`${approval.name}`, margin + 8, y + 4);
      doc.text(`${approval.date} at ${approval.time}`, margin + 8, y + 8);
      
      doc.setFont("helvetica", "bold");
      doc.text(approval.status, pageWidth - margin - 30, y + 4, { align: "right" });
      
      if (approval.comments) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6);
        doc.text(`Comments: "${approval.comments}"`, margin + 8, y + 12);
        y += 16;
      } else {
        y += 12;
      }
      y += 3;
    });

    y += 8;

    // Status Section - Compact
    y = addSectionHeader("DOCUMENT STATUS", y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const statusColor: [number, number, number] = movement.status === 'approved' ? [0, 150, 0] : movement.status === 'completed' ? [0, 100, 200] : [200, 100, 0];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`STATUS: ${movement.status.toUpperCase()}`, margin + 5, y);
    doc.setTextColor(0, 0, 0);

    // Footer - Compact
    y = doc.internal.pageSize.height - 20;
    addLine(y - 3);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("This document serves as an official attachment for Purchase Order processing.", pageWidth / 2, y + 2, { align: "center" });
    doc.text("Generated by Sika Mozambique Internal Requisition Management System", pageWidth / 2, y + 6, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.text(`Page 1 of 1`, pageWidth - margin, y + 10, { align: "right" });

    // Save the PDF
    doc.save(`${movement.journalNumber}_PO_Attachment.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{movement.journalNumber}</h1>
            <div className="flex items-center space-x-4 mt-2">
              {getStatusBadge(movement.status)}
              {movement.requestType === 'shopping_card' && (
                <Badge variant="outline">Shopping Card</Badge>
              )}
              <span className="text-muted-foreground">
                Created on {new Date(movement.requestedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            {movement.status === 'approved' && (
              <Button 
                onClick={() => {
                  generatePDF(movement);
                  toast({
                    title: "PDF generated",
                    description: "PO attachment document has been downloaded.",
                  });
                }}
                className="bg-success hover:bg-success/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF Document
              </Button>
            )}
            {canUserEdit && (
              <Button onClick={() => navigate(`/movement/edit/${movement.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Journal Name</Label>
                    <p>{movement.journalName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <p>{new Date(movement.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Request Type</Label>
                  <p className="mt-1">
                    {movement.requestType === 'shopping_card' ? 'Shopping Card' : 'Material Movement'}
                    {movement.requestType === 'shopping_card' && movement.shoppingCardType && (
                      <span className="ml-2 text-muted-foreground">({movement.shoppingCardType})</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                  <p className="mt-1">{movement.reason}</p>
                </div>
                {movement.requestType === 'shopping_card' && (
                  <div className="grid grid-cols-2 gap-4">
                    {movement.deliveryDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Desired Delivery Date</Label>
                        <p>{new Date(movement.deliveryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {movement.preferredSupplier && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Preferred Supplier</Label>
                        <p>{movement.preferredSupplier}</p>
                      </div>
                    )}
                  </div>
                )}
                {(movement.clientName || movement.clientId) && (
                  <div className="grid grid-cols-2 gap-4">
                    {movement.clientName && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Client Name</Label>
                        <p>{movement.clientName}</p>
                      </div>
                    )}
                    {movement.clientId && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Client ID</Label>
                        <p>{movement.clientId}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Items ({movement.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {movement.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Item {index + 1}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Code</Label>
                          <p>{item.itemCode}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Description</Label>
                          <p>{item.description}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Quantity</Label>
                          <p>{item.quantity} {item.unit}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Type</Label>
                          <p className={item.movementType === '+' ? 'text-success' : 'text-destructive'}>
                            {item.movementType === '+' ? 'Add to stock' : 'Remove from stock'}
                          </p>
                        </div>
                        {item.batchNumber && (
                          <div>
                            <Label className="text-muted-foreground">Batch</Label>
                            <p>{item.batchNumber}</p>
                          </div>
                        )}
                        {item.costCenter && (
                          <div>
                            <Label className="text-muted-foreground">CC</Label>
                            <p>{item.costCenter}</p>
                          </div>
                        )}
                        {item.internalCostCenter && (
                          <div>
                            <Label className="text-muted-foreground">CCI</Label>
                            <p>{item.internalCostCenter}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Movement Reasons - Only show for material movements */}
            {movement.requestType === 'material_movement' && (
              <Card>
                <CardHeader>
                  <CardTitle>Movement Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries({
                      sample: "Sample",
                      offer: "Offer",
                      laboratoryTesting: "Laboratory Testing",
                      commercialAction: "Commercial Action",
                      maintenance: "Maintenance",
                      spillage: "Spillage",
                      equipmentWashing: "Equipment Washing",
                      damagedProducts: "Damaged Products",
                      nonConformingProducts: "Non-conforming Products",
                      transferBetweenWarehouses: "Transfer between Warehouses",
                      inventoryAdjustmentPositive: "Inventory Adjustment (+)",
                      inventoryAdjustmentNegative: "Inventory Adjustment (-)",
                      productionLossGain: "Production Loss/Gain",
                      assetEnhancement: "Asset Enhancement",
                      ibcMovement: "IBC Movement",
                      others: "Others"
                    }).map(([key, label]) => {
                      const isSelected = movement.movementReasons[key as keyof typeof movement.movementReasons];
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-sm border ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                          <span className={`text-sm ${isSelected ? 'font-medium' : 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requested */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Requested</p>
                    <p className="text-sm text-muted-foreground">
                      by {movement.requestedByName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.requestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Manager Approval */}
                {movement.managerApproval && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Manager Approved</p>
                      <p className="text-sm text-muted-foreground">
                        by {movement.managerApproval.approverName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.managerApproval.approvedAt).toLocaleString()}
                      </p>
                      {movement.managerApproval.comments && (
                        <p className="text-xs mt-1 italic">"{movement.managerApproval.comments}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Approval */}
                {movement.finalApproval && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Final Approval</p>
                      <p className="text-sm text-muted-foreground">
                        by {movement.finalApproval.approverName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.finalApproval.approvedAt).toLocaleString()}
                      </p>
                      {movement.finalApproval.comments && (
                        <p className="text-xs mt-1 italic">"{movement.finalApproval.comments}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Warehouse Completion */}
                {movement.warehouseCompletion && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        by {movement.warehouseCompletion.completedByName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.warehouseCompletion.completedAt).toLocaleString()}
                      </p>
                      {movement.warehouseCompletion.notes && (
                        <p className="text-xs mt-1 italic">"{movement.warehouseCompletion.notes}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection */}
                {movement.status === 'rejected' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-destructive">Rejected</p>
                      {movement.rejectionReason && (
                        <p className="text-xs mt-1 italic">"{movement.rejectionReason}"</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {(canUserApprove || canUserComplete || canUserReject || canUserCancel) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canUserApprove && (
                    <>
                      <div>
                        <Label htmlFor="comments">Comments (optional)</Label>
                        <Textarea
                          id="comments"
                          placeholder="Add any comments..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleApprove}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleReject}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </>
                  )}

                  {canUserComplete && (
                    <>
                      <div>
                        <Label htmlFor="warehouseNotes">Warehouse Notes (optional)</Label>
                        <Textarea
                          id="warehouseNotes"
                          placeholder="Add completion notes..."
                          value={warehouseNotes}
                          onChange={(e) => setWarehouseNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleComplete}
                        className="w-full"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    </>
                  )}

                  {canUserReject && (
                    <>
                      <div>
                        <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                        <Textarea
                          id="rejectionReason"
                          placeholder="Please provide reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={handleProcurementReject}
                        className="w-full"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject (Procurement)
                      </Button>
                    </>
                  )}

                  {canUserCancel && (
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};