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
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold text-foreground">
              {request.request_number}
            </h1>
            {getStatusBadge(request.status)}
            <span className="text-muted-foreground">
              Created on {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
          
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
                Generate PDF
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - General Information */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">General Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Journal Name</div>
                  <div className="font-medium">{request.request_type}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Date</div>
                  <div className="font-medium">{new Date(request.created_at).toLocaleDateString()}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Request Type</div>
                  <div className="font-medium">{request.request_type}</div>
                </div>
                
                {request.delivery_date && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Delivery Date</div>
                    <div className="font-medium">{new Date(request.delivery_date).toLocaleDateString()}</div>
                  </div>
                )}
                
                {request.preferred_supplier && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Preferred Supplier</div>
                    <div className="font-medium">{request.preferred_supplier}</div>
                  </div>
                )}
                
                {request.client_name && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Client Name</div>
                    <div className="font-medium">{request.client_name}</div>
                  </div>
                )}
              </div>
              
              {request.justification && (
                <div className="mt-6">
                  <div className="text-sm text-muted-foreground mb-1">Reason</div>
                  <div className="font-medium">{request.justification}</div>
                </div>
              )}
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-5 w-5 bg-foreground rounded-sm"></div>
                <h2 className="text-2xl font-semibold">Items ({request.request_items.length})</h2>
              </div>
              
              <div className="space-y-6">
                {request.request_items.map((item, index) => (
                  <div key={index} className="border-b pb-6 last:border-b-0">
                    <h3 className="font-semibold text-lg mb-3">Item {index + 1}</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Code</div>
                        <div className="font-medium">{item.item_code}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Description</div>
                        <div className="font-medium">{item.description}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Quantity</div>
                        <div className="font-medium">{item.quantity} {item.unit}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Type</div>
                        <div className="font-medium">{item.supplier || 'Standard'}</div>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-1">Notes</div>
                        <div className="text-sm">{item.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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

          {/* Right Column - Timeline */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-5 w-5 border-2 border-foreground rounded-full"></div>
                <h2 className="text-2xl font-semibold">Timeline</h2>
              </div>
              
              <div className="space-y-6">
                {/* Requested */}
                <div className="flex items-start space-x-3">
                  <div className="h-3 w-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Requested</div>
                    <div className="text-sm text-muted-foreground">
                      by {request.requester.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}, {new Date(request.created_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })}
                    </div>
                  </div>
                </div>

                {/* Manager Approval */}
                {request.manager_approved_at && request.manager_approval ? (
                  <div className="flex items-start space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Manager Approved</div>
                      <div className="text-sm text-muted-foreground">
                        by {request.manager_approval.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.manager_approved_at).toLocaleDateString()}, {new Date(request.manager_approved_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                      {request.manager_comments && (
                        <div className="text-sm text-muted-foreground italic mt-1">
                          "{request.manager_comments}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : request.status === 'pending_approval' ? (
                  <div className="flex items-start space-x-3">
                    <div className="h-3 w-3 border-2 border-muted-foreground rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-muted-foreground">Pending Manager Approval</div>
                      <div className="text-sm text-muted-foreground">Waiting for manager review</div>
                    </div>
                  </div>
                ) : null}

                {/* Final Approval (if applicable) */}
                {request.status === 'approved' && !request.procurement_completed_at && (
                  <div className="flex items-start space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Final Approval</div>
                      <div className="text-sm text-muted-foreground">
                        by Finance Controller
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.manager_approved_at || request.created_at).toLocaleDateString()}, {new Date(request.manager_approved_at || request.created_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion */}
                {request.procurement_completed_at && request.procurement_handler ? (
                  <div className="flex items-start space-x-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Completed</div>
                      <div className="text-sm text-muted-foreground">
                        by {request.procurement_handler.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.procurement_completed_at).toLocaleDateString()}, {new Date(request.procurement_completed_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                      {request.procurement_notes && (
                        <div className="text-sm text-muted-foreground italic mt-1">
                          "{request.procurement_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Rejection */}
                {request.rejection_reason && (
                  <div className="flex items-start space-x-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-red-500">Rejected</div>
                      <div className="text-sm text-muted-foreground">
                        Reason: {request.rejection_reason}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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