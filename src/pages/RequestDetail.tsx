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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Request {request.request_number}
              </h1>
              <p className="text-muted-foreground">
                Created by {request.requester.full_name} on {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(request.status)}
            {canEdit && (
              <Button onClick={() => navigate(`/request/edit/${request.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {userCanGeneratePDF && (
              <Button variant="outline" onClick={generatePDF}>
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Request Type:</strong> {request.request_type}
                  </div>
                  <div>
                    <strong>Status:</strong> {request.status}
                  </div>
                  {request.delivery_date && (
                    <div>
                      <strong>Delivery Date:</strong> {new Date(request.delivery_date).toLocaleDateString()}
                    </div>
                  )}
                  {request.preferred_supplier && (
                    <div>
                      <strong>Preferred Supplier:</strong> {request.preferred_supplier}
                    </div>
                  )}
                  {request.client_name && (
                    <div>
                      <strong>Client Name:</strong> {request.client_name}
                    </div>
                  )}
                  {request.client_id && (
                    <div>
                      <strong>Client ID:</strong> {request.client_id}
                    </div>
                  )}
                </div>
                
                {request.justification && (
                  <div>
                    <strong>Justification:</strong>
                    <p className="mt-1 text-muted-foreground">{request.justification}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Request Items */}
            <Card>
              <CardHeader>
                <CardTitle>Request Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.request_items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Item Code:</strong> {item.item_code}
                        </div>
                        <div>
                          <strong>Description:</strong> {item.description}
                        </div>
                        <div>
                          <strong>Quantity:</strong> {item.quantity} {item.unit}
                        </div>
                        {item.unit_price && (
                          <div>
                            <strong>Unit Price:</strong> ${item.unit_price}
                          </div>
                        )}
                        {item.supplier && (
                          <div>
                            <strong>Supplier:</strong> {item.supplier}
                          </div>
                        )}
                        {item.total_price && item.total_price > 0 && (
                          <div>
                            <strong>Total Price:</strong> ${item.total_price}
                          </div>
                        )}
                      </div>
                      {item.notes && (
                        <div className="mt-2">
                          <strong>Notes:</strong>
                          <p className="text-muted-foreground">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {request.total_amount && request.total_amount > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="text-lg font-semibold text-right">
                      Total Amount: ${request.total_amount}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Actions */}
            {(userCanApprove || userCanManage) && request.status !== 'completed' && request.status !== 'rejected' && (
              <Card>
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

            {/* Approval History */}
            {(request.manager_approved_at || request.procurement_completed_at || request.rejection_reason) && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.manager_approved_at && request.manager_approval && (
                    <div className="text-sm">
                      <div className="font-medium text-success">Approved by Manager</div>
                      <div className="text-muted-foreground">
                        {request.manager_approval.full_name} on {new Date(request.manager_approved_at).toLocaleDateString()}
                      </div>
                      {request.manager_comments && (
                        <div className="mt-1 text-muted-foreground">
                          "{request.manager_comments}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {request.procurement_completed_at && request.procurement_handler && (
                    <div className="text-sm">
                      <div className="font-medium">Completed by Procurement</div>
                      <div className="text-muted-foreground">
                        {request.procurement_handler.full_name} on {new Date(request.procurement_completed_at).toLocaleDateString()}
                      </div>
                      {request.procurement_notes && (
                        <div className="mt-1 text-muted-foreground">
                          "{request.procurement_notes}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {request.rejection_reason && (
                    <div className="text-sm">
                      <div className="font-medium text-destructive">Rejected</div>
                      <div className="mt-1 text-muted-foreground">
                        "{request.rejection_reason}"
                      </div>
                    </div>
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