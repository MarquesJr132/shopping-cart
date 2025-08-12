import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Edit, FileText, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { getShoppingRequestById, updateShoppingRequest, canApprove, canManage, canGeneratePDF, type ShoppingRequestWithItems } from "@/lib/supabase";
import jsPDF from 'jspdf';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [request, setRequest] = useState<ShoppingRequestWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    
    try {
      const requestData = await getShoppingRequestById(id);
      setRequest(requestData);
    } catch (error) {
      console.error('Error loading request:', error);
      toast({
        title: "Error",
        description: "Failed to load request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleApprove = async () => {
    if (!request || !profile) return;

    setActionLoading(true);
    try {
      await updateShoppingRequest(request.id, {
        status: 'approved',
        manager_approval_id: profile.id,
        manager_approved_at: new Date().toISOString(),
        manager_comments: comments || null
      });

      toast({
        title: "Success",
        description: "Request approved successfully.",
      });

      loadRequest();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setComments("");
    }
  };

  const handleReject = async () => {
    if (!request || !profile) return;

    setActionLoading(true);
    try {
      await updateShoppingRequest(request.id, {
        status: 'rejected',
        rejection_reason: comments || 'No reason provided'
      });

      toast({
        title: "Success",
        description: "Request rejected.",
      });

      loadRequest();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setComments("");
    }
  };

  const handleComplete = async () => {
    if (!request || !profile) return;

    setActionLoading(true);
    try {
      await updateShoppingRequest(request.id, {
        status: 'completed',
        procurement_handled_by: profile.id,
        procurement_completed_at: new Date().toISOString(),
        procurement_notes: comments || null
      });

      toast({
        title: "Success",
        description: "Request marked as completed.",
      });

      loadRequest();
    } catch (error: any) {
      console.error('Error completing request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setComments("");
    }
  };

  const handleCancel = async () => {
    if (!request || !profile) return;

    setActionLoading(true);
    try {
      await updateShoppingRequest(request.id, {
        status: 'cancelled',
        procurement_notes: comments || 'Cancelled for editing'
      });

      toast({
        title: "Success",
        description: "Request cancelled for editing.",
      });

      loadRequest();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setComments("");
    }
  };

  const generatePDF = () => {
    if (!request) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Shopping Request', 20, 30);
    
    // Request details
    doc.setFontSize(12);
    doc.text(`Request Number: ${request.request_number}`, 20, 50);
    doc.text(`Request Type: ${request.request_type}`, 20, 60);
    doc.text(`Requester: ${request.requester.full_name}`, 20, 70);
    doc.text(`Status: ${request.status}`, 20, 80);
    doc.text(`Created: ${new Date(request.created_at).toLocaleDateString()}`, 20, 90);
    
    if (request.delivery_date) {
      doc.text(`Delivery Date: ${new Date(request.delivery_date).toLocaleDateString()}`, 20, 100);
    }
    
    if (request.preferred_supplier) {
      doc.text(`Preferred Supplier: ${request.preferred_supplier}`, 20, 110);
    }

    // Items
    doc.text('Items:', 20, 130);
    let yPos = 140;
    
    request.request_items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.description}`, 25, yPos);
      doc.text(`   Code: ${item.item_code}`, 25, yPos + 10);
      doc.text(`   Quantity: ${item.quantity} ${item.unit}`, 25, yPos + 20);
      if (item.unit_price) {
        doc.text(`   Unit Price: $${item.unit_price}`, 25, yPos + 30);
        doc.text(`   Total: $${item.total_price}`, 25, yPos + 40);
        yPos += 50;
      } else {
        yPos += 30;
      }
    });

    if (request.total_amount && request.total_amount > 0) {
      yPos += 10;
      doc.text(`Total Amount: $${request.total_amount}`, 20, yPos);
    }

    // Save the PDF
    doc.save(`shopping-request-${request.request_number}.pdf`);
    
    toast({
      title: "Success",
      description: "PDF generated successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!request || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Request not found</div>
        </div>
      </div>
    );
  }

  const canEdit = request.requester.user_id === profile.user_id && (request.status === 'draft' || request.status === 'cancelled');
  const userCanApprove = canApprove(profile.role, request.status);
  const userCanManage = canManage(profile.role);
  const userCanGeneratePDF = canGeneratePDF(profile.role);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-3">
              {canEdit && (
                <Button size="sm" onClick={() => navigate(`/request/edit/${request.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {userCanGeneratePDF && (
                <Button size="sm" variant="outline" onClick={generatePDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-bold tracking-tight">
                {request.request_number}
              </h1>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-lg text-muted-foreground">
              Created on {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* General Information */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Request Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Basic details and specifications</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Request Type</div>
                      <div className="text-lg font-semibold">{request.request_type}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Created Date</div>
                      <div className="text-lg font-semibold">{new Date(request.created_at).toLocaleDateString()}</div>
                    </div>
                    {request.delivery_date && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Delivery Date</div>
                        <div className="text-lg font-semibold">{new Date(request.delivery_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {request.preferred_supplier && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Preferred Supplier</div>
                        <div className="text-lg font-semibold">{request.preferred_supplier}</div>
                      </div>
                    )}
                    {request.client_name && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Client Name</div>
                        <div className="text-lg font-semibold">{request.client_name}</div>
                      </div>
                    )}
                  </div>
                  
                  {request.justification && (
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Justification</div>
                        <div className="text-base leading-relaxed bg-muted/30 p-4 rounded-lg">
                          {request.justification}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <div className="h-5 w-5 bg-primary rounded-md" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Items Requested</CardTitle>
                      <p className="text-sm text-muted-foreground">{request.request_items.length} item{request.request_items.length !== 1 ? 's' : ''} total</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {request.request_items.map((item, index) => (
                    <div key={index} className="p-6 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {item.description}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                              {item.item_code}
                            </span>
                            <span className="font-medium">
                              {item.quantity} {item.unit}
                            </span>
                            {item.supplier && (
                              <span className="text-primary">
                                {item.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                        {(item.unit_price || item.total_price) && (
                          <div className="text-right ml-4">
                            {item.unit_price && (
                              <div className="text-sm text-muted-foreground">
                                ${item.unit_price}/{item.unit}
                              </div>
                            )}
                            {item.total_price && (
                              <div className="font-semibold text-lg">
                                ${item.total_price}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Notes</div>
                          <div className="text-sm">{item.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {request.total_amount && request.total_amount > 0 && (
                  <div className="border-t bg-muted/30 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">
                        ${request.total_amount}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card for mobile */}
            {(userCanApprove || userCanManage) && request.status !== 'completed' && request.status !== 'rejected' && (
              <Card className="lg:hidden">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comments-mobile">Comments</Label>
                    <Textarea
                      id="comments-mobile"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add comments..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {userCanApprove && request.status === 'pending_approval' && (
                      <>
                        <Button 
                          onClick={handleApprove} 
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button 
                          onClick={handleReject} 
                          disabled={actionLoading}
                          variant="destructive"
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </>
                    )}
                    
                    {userCanManage && request.status === 'approved' && (
                      <Button 
                        onClick={handleComplete} 
                        disabled={actionLoading}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                    
                    {userCanManage && (request.status === 'approved' || request.status === 'pending_approval') && (
                      <Button 
                        onClick={handleCancel} 
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel for Editing
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timeline Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <div className="h-4 w-4 border-2 border-primary rounded-full" />
                </div>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requested */}
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 bg-destructive rounded-full mt-1" />
                    <div className="w-px h-6 bg-border" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Requested</div>
                    <div className="text-xs text-muted-foreground">
                      by {request.requester.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}, {new Date(request.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Manager Approval */}
                {request.manager_approved_at && request.manager_approval ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mt-1" />
                      {(request.procurement_completed_at || request.rejection_reason) && (
                        <div className="w-px h-6 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">Manager Approved</div>
                      <div className="text-xs text-muted-foreground">
                        by {request.manager_approval.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.manager_approved_at).toLocaleDateString()}, {new Date(request.manager_approved_at).toLocaleTimeString()}
                      </div>
                      {request.manager_comments && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          "{request.manager_comments}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : request.status === 'pending_approval' ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 border-2 border-muted-foreground rounded-full mt-1" />
                      <div className="w-px h-6 bg-border" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-muted-foreground">Pending Manager Approval</div>
                      <div className="text-xs text-muted-foreground">Waiting for manager review</div>
                    </div>
                  </div>
                ) : null}

                {/* Completion or Final Approval */}
                {request.procurement_completed_at && request.procurement_handler ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">Completed</div>
                      <div className="text-xs text-muted-foreground">
                        by {request.procurement_handler.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.procurement_completed_at).toLocaleDateString()}, {new Date(request.procurement_completed_at).toLocaleTimeString()}
                      </div>
                      {request.procurement_notes && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          "{request.procurement_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : request.status === 'approved' ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 border-2 border-muted-foreground rounded-full mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-muted-foreground">Pending Completion</div>
                      <div className="text-xs text-muted-foreground">Waiting for procurement</div>
                    </div>
                  </div>
                ) : null}

                {/* Rejection */}
                {request.rejection_reason && (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-destructive rounded-full mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-destructive">Rejected</div>
                      <div className="text-xs text-muted-foreground">
                        Reason: {request.rejection_reason}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions for desktop */}
            {(userCanApprove || userCanManage) && request.status !== 'completed' && request.status !== 'rejected' && (
              <Card className="hidden lg:block">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add comments..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {userCanApprove && request.status === 'pending_approval' && (
                      <>
                        <Button 
                          onClick={handleApprove} 
                          disabled={actionLoading}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button 
                          onClick={handleReject} 
                          disabled={actionLoading}
                          variant="destructive"
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </>
                    )}
                    
                    {userCanManage && request.status === 'approved' && (
                      <Button 
                        onClick={handleComplete} 
                        disabled={actionLoading}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                    
                    {userCanManage && (request.status === 'approved' || request.status === 'pending_approval') && (
                      <Button 
                        onClick={handleCancel} 
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel for Editing
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};