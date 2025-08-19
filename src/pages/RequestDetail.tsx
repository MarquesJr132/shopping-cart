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
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
    
    // Clean white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header Section with enhanced styling
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Shopping Card', 105, 22, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sika Mozambique', 105, 30, { align: 'center' });
    
    // Horizontal line under header - closer to header
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);
    
    // Document info with reduced spacing
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Document ID: ${request.request_number}`, 20, 48);
    doc.text(`Generated: ${formattedDate} ${formattedTime}`, 120, 48);
    
    // Two-column layout with reduced top margin
    const leftColumnX = 20;
    const rightColumnX = 110;
    const sectionY = 58; // Reduced from 70 to 58
    
    // Requestor Information Section (left column)
    doc.setFillColor(245, 245, 245);
    doc.rect(leftColumnX, sectionY, 85, 7, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('REQUESTOR INFORMATION', leftColumnX + 2, sectionY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Requested By:', leftColumnX + 2, sectionY + 15);
    doc.text(request.requester.full_name, leftColumnX + 35, sectionY + 15);
    
    doc.text('Position:', leftColumnX + 2, sectionY + 22);
    doc.text(request.requester.position || 'Not assigned', leftColumnX + 35, sectionY + 22);
    
    doc.text('Cost Center:', leftColumnX + 2, sectionY + 29);
    doc.text(request.requester.cost_center || 'Not assigned', leftColumnX + 35, sectionY + 29);
    
    doc.text('Request Date:', leftColumnX + 2, sectionY + 36);
    doc.text(new Date(request.created_at).toLocaleDateString('pt-PT'), leftColumnX + 35, sectionY + 36);
    
    doc.text('Description/Reason:', leftColumnX + 2, sectionY + 43);
    doc.text(request.justification || 'out of tonner', leftColumnX + 35, sectionY + 43);
    
    // Movement Details Section (right column)
    doc.setFillColor(240, 240, 240);
    doc.rect(rightColumnX, sectionY, 75, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MOVEMENT DETAILS', rightColumnX + 2, sectionY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Journal Number:', rightColumnX + 2, sectionY + 15);
    doc.text(request.request_number, rightColumnX + 35, sectionY + 15);
    
    doc.text('Journal Name:', rightColumnX + 2, sectionY + 22);
    doc.text('Shopping Card', rightColumnX + 35, sectionY + 22);
    
    doc.text('Request Type:', rightColumnX + 2, sectionY + 29);
    doc.text('Shopping Card', rightColumnX + 35, sectionY + 29);
    
    doc.text('Shopping Card Type:', rightColumnX + 2, sectionY + 36);
    doc.text('Material', rightColumnX + 35, sectionY + 36);
    
    // Item Details Section
    const itemSectionY = sectionY + 55;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, itemSectionY, 170, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM DETAILS', 22, itemSectionY + 5);
    
    // Table headers with proper spacing
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', 25, itemSectionY + 18);
    doc.text('DESCRIPTION', 60, itemSectionY + 18);
    doc.text('QTY', 170, itemSectionY + 18);
    
    // Table border lines
    doc.line(20, itemSectionY + 20, 190, itemSectionY + 20);
    
    // Table content
    doc.setFont('helvetica', 'normal');
    let yPos = itemSectionY + 28;
    
    request.request_items.forEach((item, index) => {
      doc.text(`${index + 1}.`, 25, yPos);
      doc.text(item.description, 60, yPos);
      doc.text(`${item.quantity} ${item.unit}`, 170, yPos);
      yPos += 8;
    });
    
    // Approval Workflow Section
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('APPROVAL WORKFLOW', 22, yPos + 5);
    
    yPos += 18;
    
    // Step 1: Requested By (more compact)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('1. REQUESTED BY', 25, yPos);
    doc.text('•  S u b m i t t e d', 150, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`${request.requester.full_name} (${request.requester.position || 'Position not set'})`, 25, yPos);
    yPos += 4;
    doc.text(new Date(request.created_at).toLocaleDateString('pt-PT'), 25, yPos);
    
    // Step 2: Manager Approval (more compact)
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('2. MANAGER APPROVAL', 25, yPos);
    
    if (request.manager_approval && request.manager_approved_at) {
      doc.text('•  A p p r o v e d', 150, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${request.manager_approval.full_name} (${request.manager_approval.position || 'Position not set'})`, 25, yPos);
      yPos += 4;
      doc.text(new Date(request.manager_approved_at).toLocaleDateString('pt-PT'), 25, yPos);
    } else {
      doc.text('•  P e n d i n g', 150, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Awaiting manager approval', 25, yPos);
    }
    
    // Document Status Section
    yPos += 25;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DOCUMENT STATUS', 22, yPos + 5);
    
    yPos += 18;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Set color based on status
    if (request.status === 'approved') {
      doc.setTextColor(0, 128, 0); // Green
    } else if (request.status === 'rejected') {
      doc.setTextColor(255, 0, 0); // Red
    } else {
      doc.setTextColor(255, 165, 0); // Orange for pending
    }
    
    doc.text(`STATUS: ${request.status.toUpperCase()}`, 25, yPos);
    
    // Professional footer with horizontal line
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.line(20, 270, 190, 270); // Footer line
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This document serves as an official attachment for Purchase Order processing.', 105, 278, { align: 'center' });
    doc.text('Generated by Sika Mozambique Internal Shopping Card', 105, 285, { align: 'center' });
    doc.text('Page 1 of 1', 180, 285);

    // Save the PDF
    doc.save(`shopping-card-${request.request_number}.pdf`);
    
    toast({
      title: "Success",
      description: "Shopping Card PDF generated successfully.",
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
      
      <div className="container mx-auto px-4 py-4 md:px-8 md:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200 space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
              {request.request_number}
            </h1>
            {getStatusBadge(request.status)}
            <span className="text-gray-600 text-sm md:text-lg">
              Created on {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {canEdit && (
              <Button 
                onClick={() => navigate(`/request/edit/${request.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {userCanGeneratePDF && (
              <Button 
                variant="outline" 
                onClick={generatePDF}
                className="border-gray-300 hover:bg-gray-50"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generate </span>PDF
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-sm md:text-lg font-medium"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Back to </span>Dashboard
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Left Column - General Information & Items */}
          <div className="lg:col-span-3 space-y-4 md:space-y-8">
            {/* General Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">General Information</h2>
                </div>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 font-medium">Journal Name</div>
                    <div className="text-base md:text-lg font-medium text-gray-900">{request.request_type}</div>
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
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="h-4 w-4 md:h-5 md:w-5 bg-gray-900 rounded-sm flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-sm"></div>
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Items ({request.request_items.length})</h2>
                </div>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="space-y-6 md:space-y-8">
                  {request.request_items.map((item, index) => (
                    <div key={index} className={index !== request.request_items.length - 1 ? "pb-6 md:pb-8 border-b border-gray-100" : ""}>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Item {index + 1}</h3>
                      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Code</div>
                          <div className="text-sm md:text-base font-medium text-gray-900 break-all">{item.item_code}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Description</div>
                          <div className="text-sm md:text-base font-medium text-gray-900">{item.description}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Quantity</div>
                          <div className="text-sm md:text-base font-medium text-gray-900">{item.quantity} {item.unit}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Type</div>
                          <div className="text-sm md:text-base font-medium text-gray-900">{item.supplier || 'Standard'}</div>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-3 md:mt-4 space-y-1">
                          <div className="text-sm text-gray-500 font-medium">Notes</div>
                          <div className="text-sm md:text-base text-gray-700">{item.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {request.total_amount && request.total_amount > 0 && (
                  <div className="border-t border-gray-100 pt-4 md:pt-6 mt-6 md:mt-8">
                    <div className="text-lg md:text-xl font-semibold text-gray-900 text-right">
                      Total Amount: ${request.total_amount}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-8">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Timeline</h2>
                </div>
              </div>
              
              <div className="p-4 md:p-6">
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
                          by {request.manager_approval?.position || request.manager_approval?.full_name || 'Manager'}
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