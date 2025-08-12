import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Trash2, Plus } from "lucide-react";
import { createShoppingRequest, getShoppingRequestById, updateShoppingRequest, addRequestItems, deleteRequestItems } from "@/lib/supabase";

interface RequestItem {
  item_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  supplier?: string;
  notes?: string;
}

export const RequestForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RequestItem[]>([
    { item_code: "", description: "", quantity: 1, unit: "Unit" }
  ]);

  const [formData, setFormData] = useState({
    request_type: searchParams.get('type') || 'material',
    delivery_date: '',
    preferred_supplier: '',
    client_name: '',
    client_id: '',
    justification: ''
  });

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    
    try {
      const request = await getShoppingRequestById(id);
      setFormData({
        request_type: request.request_type,
        delivery_date: request.delivery_date || '',
        preferred_supplier: request.preferred_supplier || '',
        client_name: request.client_name || '',
        client_id: request.client_id || '',
        justification: request.justification || ''
      });
      
      if (request.request_items && request.request_items.length > 0) {
        setItems(request.request_items.map(item => ({
          item_code: item.item_code,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
          supplier: item.supplier || '',
          notes: item.notes || ''
        })));
      }
    } catch (error) {
      console.error('Error loading request:', error);
      toast({
        title: "Error",
        description: "Failed to load request.",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setItems([...items, { item_code: "", description: "", quantity: 1, unit: "Unit" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequestItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * (item.unit_price || 0);
      return total + itemTotal;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const requestData = {
        requester_id: profile.id,
        request_type: formData.request_type,
        delivery_date: formData.delivery_date || null,
        preferred_supplier: formData.preferred_supplier || null,
        client_name: formData.client_name || null,
        client_id: formData.client_id || null,
        justification: formData.justification || null,
        total_amount: calculateTotal(),
        status: 'draft' as const
      };

      let requestId = id;
      
      if (id) {
        // Update existing request
        await updateShoppingRequest(id, requestData);
        await deleteRequestItems(id);
      } else {
        // Create new request
        const newRequest = await createShoppingRequest(requestData);
        requestId = newRequest.id;
      }

      // Add items
      const itemsData = items.filter(item => item.item_code && item.description).map(item => ({
        item_code: item.item_code,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price || null,
        total_price: item.quantity * (item.unit_price || 0),
        supplier: item.supplier || null,
        notes: item.notes || null
      }));

      if (itemsData.length > 0 && requestId) {
        await addRequestItems(requestId, itemsData);
      }

      toast({
        title: "Success",
        description: `Request ${id ? 'updated' : 'created'} successfully.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitForApproval = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const requestData = {
        requester_id: profile.id,
        request_type: formData.request_type,
        delivery_date: formData.delivery_date || null,
        preferred_supplier: formData.preferred_supplier || null,
        client_name: formData.client_name || null,
        client_id: formData.client_id || null,
        justification: formData.justification || null,
        total_amount: calculateTotal(),
        status: 'pending_approval' as const,
        manager_approval_id: profile.manager_id
      };

      let requestId = id;
      
      if (id) {
        await updateShoppingRequest(id, requestData);
        await deleteRequestItems(id);
      } else {
        const newRequest = await createShoppingRequest(requestData);
        requestId = newRequest.id;
      }

      const itemsData = items.filter(item => item.item_code && item.description).map(item => ({
        item_code: item.item_code,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price || null,
        total_price: item.quantity * (item.unit_price || 0),
        supplier: item.supplier || null,
        notes: item.notes || null
      }));

      if (itemsData.length > 0 && requestId) {
        await addRequestItems(requestId, itemsData);
      }

      toast({
        title: "Success",
        description: "Request submitted for approval.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {id ? 'Edit Request' : 'New Shopping Request'}
          </h1>
          <p className="text-muted-foreground">
            Create a new shopping request for {formData.request_type === 'service' ? 'services' : 'materials'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="request_type">Request Type</Label>
                  <Select 
                    value={formData.request_type} 
                    onValueChange={(value) => setFormData({ ...formData, request_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_supplier">Preferred Supplier</Label>
                  <Input
                    id="preferred_supplier"
                    value={formData.preferred_supplier}
                    onChange={(e) => setFormData({ ...formData, preferred_supplier: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  placeholder="Explain the business need for this request..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Request Items</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Item Code</Label>
                      <Input
                        value={item.item_code}
                        onChange={(e) => updateItem(index, 'item_code', e.target.value)}
                        placeholder="SKU/Code"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select 
                        value={item.unit} 
                        onValueChange={(value) => updateItem(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unit">Unit</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Liter">Liter</SelectItem>
                          <SelectItem value="Piece">Piece</SelectItem>
                          <SelectItem value="Box">Box</SelectItem>
                          <SelectItem value="Meter">Meter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || undefined)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Input
                        value={item.supplier || ''}
                        onChange={(e) => updateItem(index, 'supplier', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Additional notes for this item..."
                      rows={2}
                    />
                  </div>

                  {item.unit_price && (
                    <div className="flex justify-end">
                      <Badge variant="secondary">
                        Total: ${(item.quantity * item.unit_price).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {calculateTotal() > 0 && (
                <div className="border-t pt-4 flex justify-end">
                  <div className="text-lg font-semibold">
                    Request Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (id ? 'Update Draft' : 'Save Draft')}
            </Button>
            
            <Button 
              type="button" 
              onClick={submitForApproval} 
              disabled={loading || !profile.manager_id}
              variant="default"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
            
            <Button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
          
          {!profile.manager_id && (
            <p className="text-sm text-muted-foreground">
              Note: You need a manager assigned to submit for approval. Contact an admin to assign a manager.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};