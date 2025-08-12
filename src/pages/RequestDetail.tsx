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
import { Edit, FileText, CheckCircle, XCircle, ArrowLeft, Calendar } from "lucide-react";
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
      'completed': 'destructive',
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
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="bg-red-500 text-white hover:bg-red-600 px-3 py-1">
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-6">
            <h1 className="text-4xl font-bold text-gray-900">
              {request.request_number}
            </h1>
            {getStatusBadge(request.status)}
            <span className="text-gray-600 text-lg">
              Created on {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 text-lg font-medium"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - General Information & Items */}
          <div className="lg:col-span-3 space-y-8">
            {/* General Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">General Information</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 font-medium">Journal Name</div>
                    <div className="text-lg font-medium text-gray-900">{request.request_type}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 font-medium">Date</div>
                    <div className="text-lg font-medium text-gray-900">{new Date(request.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 font-medium">Request Type</div>
                    <div className="text-lg font-medium text-gray-900">{request.request_type}</div>
                  </div>
                  
                  {request.delivery_date && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 font-medium">Delivery Date</div>
                      <div className="text-lg font-medium text-gray-900">{new Date(request.delivery_date).toLocaleDateString()}</div>
                    </div>
                  )}
                  
                  {request.preferred_supplier && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 font-medium">Preferred Supplier</div>
                      <div className="text-lg font-medium text-gray-900">{request.preferred_supplier}</div>
                    </div>
                  )}
                  
                  {request.client_name && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 font-medium">Client Name</div>
                      <div className="text-lg font-medium text-gray-900">{request.client_name}</div>
                    </div>
                  )}
                </div>
                
                {request.justification && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 font-medium">Reason</div>
                      <div className="text-lg font-medium text-gray-900">{request.justification}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-900 rounded-sm flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-sm"></div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Items ({request.request_items.length})</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-8">
                  {request.request_items.map((item, index) => (
                    <div key={index} className={index !== request.request_items.length - 1 ? "pb-8 border-b border-gray-100" : ""}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Item {index + 1}</h3>
                      <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Code</div>
                          <div className="text-base font-medium text-gray-900">{item.item_code}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Description</div>
                          <div className="text-base font-medium text-gray-900">{item.description}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Quantity</div>
                          <div className="text-base font-medium text-gray-900">{item.quantity} {item.unit}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Type</div>
                          <div className="text-base font-medium text-gray-900">{item.supplier || 'Standard'}</div>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-4 space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Notes</div>
                          <div className="text-base text-gray-700">{item.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {request.total_amount && request.total_amount > 0 && (
                  <div className="border-t border-gray-100 pt-6 mt-8">
                    <div className="text-xl font-semibold text-gray-900 text-right">
                      Total Amount: ${request.total_amount}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {/* Requested */}
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      {(request.manager_approved_at || request.status === 'pending_approval') && (
                        <div className="w-px h-8 bg-gray-200 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">Requested</div>
                      <div className="text-sm text-gray-600">
                        by {request.requester.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}, {new Date(request.created_at).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          second: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Manager Approval */}
                  {request.manager_approved_at && request.manager_approval ? (
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        {(!request.procurement_completed_at && request.status === 'approved') && (
                          <div className="w-px h-8 bg-gray-200 mt-1"></div>
                        )}
                        {request.procurement_completed_at && (
                          <div className="w-px h-8 bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">Manager Approved</div>
                        <div className="text-sm text-gray-600">
                          by {request.manager_approval.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(request.manager_approved_at).toLocaleDateString()}, {new Date(request.manager_approved_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </div>
                        {request.manager_comments && (
                          <div className="text-sm text-gray-500 italic mt-1">
                            "{request.manager_comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  ) : request.status === 'pending_approval' ? (
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 border-2 border-gray-300 rounded-full mt-1.5 flex-shrink-0 bg-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-500">Pending Manager Approval</div>
                        <div className="text-sm text-gray-400">Waiting for manager review</div>
                      </div>
                    </div>
                  ) : null}

                  {/* Final Approval (only show if approved but not completed) */}
                  {request.status === 'approved' && !request.procurement_completed_at && (
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="w-px h-8 bg-gray-200 mt-1"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">Final Approval</div>
                        <div className="text-sm text-gray-600">
                          by Finance Controller
                        </div>
                        <div className="text-sm text-gray-500">
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
                    <div className="flex items-start space-x-4">
                      <div className="h-3 w-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">Completed</div>
                        <div className="text-sm text-gray-600">
                          by {request.procurement_handler.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(request.procurement_completed_at).toLocaleDateString()}, {new Date(request.procurement_completed_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: true 
                          })}
                        </div>
                        {request.procurement_notes && (
                          <div className="text-sm text-gray-500 italic mt-1">
                            "{request.procurement_notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ) : request.status === 'approved' && !request.procurement_completed_at ? (
                    <div className="flex items-start space-x-4">
                      <div className="h-3 w-3 border-2 border-gray-300 rounded-full mt-1.5 flex-shrink-0 bg-white"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-500">Pending Completion</div>
                        <div className="text-sm text-gray-400">Waiting for procurement</div>
                      </div>
                    </div>
                  ) : null}

                  {/* Rejection */}
                  {request.rejection_reason && (
                    <div className="flex items-start space-x-4">
                      <div className="h-3 w-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-red-600">Rejected</div>
                        <div className="text-sm text-gray-600">
                          Reason: {request.rejection_reason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Actions Section - Centered at bottom */}
        {(userCanApprove || userCanManage) && request.status !== 'completed' && request.status !== 'rejected' && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comments-main" className="text-sm font-medium text-gray-700">Comments</Label>
                  <Textarea
                    id="comments-main"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add comments..."
                    rows={3}
                    className="border-gray-200"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userCanApprove && request.status === 'pending_approval' && (
                    <>
                      <Button 
                        onClick={handleApprove} 
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Approve Request
                      </Button>
                      <Button 
                        onClick={handleReject} 
                        disabled={actionLoading}
                        variant="destructive"
                        className="font-semibold py-3"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Request
                      </Button>
                    </>
                  )}
                  
                  {userCanManage && request.status === 'approved' && (
                    <Button 
                      onClick={handleComplete} 
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 md:col-span-2"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                  
                  {userCanManage && (request.status === 'approved' || request.status === 'pending_approval') && (
                    <Button 
                      onClick={handleCancel} 
                      disabled={actionLoading}
                      variant="outline"
                      className="font-semibold py-3 md:col-span-2"
                    >
                      Cancel for Editing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};