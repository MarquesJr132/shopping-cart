import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Save } from "lucide-react";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { 
  saveMovement, 
  getMovementById, 
  generateJournalNumber, 
  MovementItem, 
  MovementReason, 
  MaterialMovement 
} from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

export const MovementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getCurrentUser();
  const { toast } = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<MaterialMovement>>({
    journalName: "Material Movement",
    journalNumber: generateJournalNumber(),
    date: new Date().toISOString().split('T')[0],
    reason: "",
    requestType: 'material_movement',
    shoppingCardType: 'Material',
    deliveryDate: "",
    preferredSupplier: "",
    clientName: "",
    clientId: "",
    items: [],
    movementReasons: {
      sample: false,
      offer: false,
      laboratoryTesting: false,
      commercialAction: false,
      maintenance: false,
      spillage: false,
      equipmentWashing: false,
      damagedProducts: false,
      nonConformingProducts: false,
      transferBetweenWarehouses: false,
      inventoryAdjustmentPositive: false,
      inventoryAdjustmentNegative: false,
      productionLossGain: false,
      assetEnhancement: false,
      ibcMovement: false,
      others: false,
    },
    status: 'draft'
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check for shopping card type from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const requestType = urlParams.get('type');
    
    if (!isEdit && requestType === 'shopping_card') {
      setFormData(prev => ({
        ...prev,
        requestType: 'shopping_card',
        journalName: 'Shopping Card',
        shoppingCardType: 'Material',
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 1 week from now
      }));
    }

    if (isEdit && id) {
      const movement = getMovementById(id);
      if (movement) {
        setFormData(movement);
      } else {
        toast({
          title: "Movement not found",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [user, navigate, id, isEdit, toast]);

  const addItem = () => {
    const isShoppingCard = formData.requestType === 'shopping_card';
    const newItem: MovementItem = {
      id: Date.now().toString(),
      itemCode: isShoppingCard ? "" : "",
      description: "",
      quantity: 0,
      unit: "Unit",
      batchNumber: isShoppingCard ? "" : "",
      costCenter: isShoppingCard ? (user?.costCenter || "") : "",
      internalCostCenter: isShoppingCard ? "" : "",
      movementType: "+",
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || []
    }));
  };

  const updateItem = (itemId: string, field: keyof MovementItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const updateMovementReason = (reason: keyof MovementReason, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      movementReasons: {
        ...prev.movementReasons!,
        [reason]: checked
      }
    }));
  };

  const validateForm = (): boolean => {
    const isShoppingCard = formData.requestType === 'shopping_card';
    
    if (!formData.reason?.trim()) {
      toast({
        title: "Validation Error",
        description: "Reason is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.items || formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one item must be added",
        variant: "destructive",
      });
      return false;
    }

    // For shopping card, only validate description and quantity
    if (isShoppingCard) {
      for (const item of formData.items) {
        if (!item.description?.trim()) {
          toast({
            title: "Validation Error",
            description: "Item description is required for shopping card requests",
            variant: "destructive",
          });
          return false;
        }
        if (!item.quantity || item.quantity <= 0) {
          toast({
            title: "Validation Error",
            description: "Item quantity must be greater than 0",
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = (submit: boolean = false) => {
    console.log('Saving movement...', { submit, formData });
    
    if (submit && !validateForm()) return;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save movements",
        variant: "destructive",
      });
      return;
    }

    try {
      const movement: MaterialMovement = {
        id: formData.id || Date.now().toString(),
        journalName: formData.journalName!,
        journalNumber: formData.journalNumber!,
        date: formData.date!,
        reason: formData.reason!,
        requestType: formData.requestType!,
        shoppingCardType: formData.shoppingCardType,
        deliveryDate: formData.deliveryDate,
        preferredSupplier: formData.preferredSupplier,
        clientName: formData.clientName,
        clientId: formData.clientId,
        items: formData.items || [],
        movementReasons: formData.movementReasons!,
        status: submit ? 'pending_manager_approval' : 'draft',
        requestedBy: user.id,
        requestedByName: user.name,
        requestedAt: formData.requestedAt || new Date().toISOString(),
      };

      saveMovement(movement);
      console.log('Movement saved successfully:', movement);

      toast({
        title: submit ? "Movement submitted" : "Movement saved",
        description: submit 
          ? "Your movement has been submitted for approval" 
          : "Your movement has been saved as draft",
      });

      // Navigate back to dashboard after successful save
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error('Error saving movement:', error);
      toast({
        title: "Save Error",
        description: "Failed to save movement. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const canEdit = formData.status === 'draft' || !isEdit;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Request' : `New ${formData.requestType === 'shopping_card' ? 'Shopping Card' : 'Material Movement'}`}
            </h1>
            <p className="text-muted-foreground">
              {formData.journalNumber}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => handleSave(false)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => handleSave(true)}>
                  Submit for Approval
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${formData.requestType === 'shopping_card' ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            {formData.requestType === 'material_movement' && (
              <>
                <TabsTrigger value="client">Client Details</TabsTrigger>
                <TabsTrigger value="reasons">Movement Reasons</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Only show request type selector for material movements */}
                {formData.requestType === 'material_movement' && (
                  <div>
                    <Label htmlFor="requestType">Request Type</Label>
                    <Select
                      value={formData.requestType}
                      onValueChange={(value: 'material_movement' | 'shopping_card') => {
                        setFormData(prev => ({ 
                          ...prev, 
                          requestType: value,
                          journalName: value === 'shopping_card' ? 'Shopping Card' : 'Material Movement'
                        }));
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material_movement">Material Movement</SelectItem>
                        <SelectItem value="shopping_card">Shopping Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="journalName">Journal Name</Label>
                    <Input
                      id="journalName"
                      value={formData.journalName}
                      onChange={(e) => setFormData(prev => ({ ...prev, journalName: e.target.value }))}
                      disabled={!canEdit}
                    />
                  </div>
                  <div>
                    <Label htmlFor="journalNumber">Journal Number</Label>
                    <Input
                      id="journalNumber"
                      value={formData.journalNumber}
                      disabled
                    />
                  </div>
                </div>
                
                {/* Only show date field for material movements */}
                {formData.requestType === 'material_movement' && (
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      disabled={!canEdit}
                    />
                  </div>
                )}
                
                 {formData.requestType === 'shopping_card' && (
                   <>
                     <div>
                       <Label htmlFor="shoppingCardType">Request Type *</Label>
                       <Select
                         value={formData.shoppingCardType}
                         onValueChange={(value: 'Service' | 'Material') => {
                           setFormData(prev => ({ ...prev, shoppingCardType: value }));
                         }}
                         disabled={!canEdit}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Material">Material</SelectItem>
                           <SelectItem value="Service">Service</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div>
                       <Label htmlFor="deliveryDate">Desired Delivery Date</Label>
                       <Input
                         id="deliveryDate"
                         type="date"
                         value={formData.deliveryDate}
                         onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                         disabled={!canEdit}
                       />
                     </div>
                     
                     <div>
                       <Label htmlFor="preferredSupplier">Preferred Supplier (Optional)</Label>
                       <Input
                         id="preferredSupplier"
                         placeholder="Enter preferred supplier name..."
                         value={formData.preferredSupplier}
                         onChange={(e) => setFormData(prev => ({ ...prev, preferredSupplier: e.target.value }))}
                         disabled={!canEdit}
                       />
                     </div>
                   </>
                 )}
                 
                 <div>
                   <Label htmlFor="reason">Reason *</Label>
                   <Textarea
                     id="reason"
                     placeholder="Enter the reason for this movement..."
                     value={formData.reason}
                     onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                     disabled={!canEdit}
                     className="min-h-20"
                   />
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Required for Offers or Samples
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client name..."
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Client ID/Number</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter client ID or number..."
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Items</CardTitle>
                  {canEdit && (
                    <Button onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!formData.items || formData.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items added yet</p>
                    {canEdit && (
                      <Button onClick={addItem} className="mt-4">
                        Add your first item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Item {formData.items!.indexOf(item) + 1}</h4>
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className={`grid gap-4 ${formData.requestType === 'shopping_card' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                          {formData.requestType === 'material_movement' && (
                            <div>
                              <Label>Item Code</Label>
                              <Input
                                value={item.itemCode}
                                onChange={(e) => updateItem(item.id, 'itemCode', e.target.value)}
                                disabled={!canEdit}
                              />
                            </div>
                          )}
                          <div>
                            <Label>Description *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              disabled={!canEdit}
                              placeholder={formData.requestType === 'shopping_card' ? 'What do you need?' : 'Item description'}
                            />
                          </div>
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              disabled={!canEdit}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updateItem(item.id, 'unit', value)}
                              disabled={!canEdit}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Kg">Kg</SelectItem>
                                <SelectItem value="Liter">Liter</SelectItem>
                                <SelectItem value="Unit">Unit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {formData.requestType === 'material_movement' && (
                            <>
                              <div>
                                <Label>Batch Number</Label>
                                <Input
                                  value={item.batchNumber}
                                  onChange={(e) => updateItem(item.id, 'batchNumber', e.target.value)}
                                  disabled={!canEdit}
                                />
                              </div>
                              <div>
                                <Label>Cost Center (CC)</Label>
                                <Input
                                  value={item.costCenter}
                                  onChange={(e) => updateItem(item.id, 'costCenter', e.target.value)}
                                  disabled={!canEdit}
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <Label>Internal Cost Center (CCI)</Label>
                                <Input
                                  value={item.internalCostCenter}
                                  onChange={(e) => updateItem(item.id, 'internalCostCenter', e.target.value)}
                                  disabled={!canEdit}
                                  maxLength={6}
                                />
                              </div>
                              <div>
                                <Label>Movement Type</Label>
                                <Select
                                  value={item.movementType}
                                  onValueChange={(value) => updateItem(item.id, 'movementType', value)}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="+">+ (Add to stock)</SelectItem>
                                    <SelectItem value="-">- (Remove from stock)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                           )}
                           {/* No cost center field for shopping cart - it's auto-filled from user */}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>

          {formData.requestType === 'material_movement' && (
            <TabsContent value="reasons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Movement Reasons</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select all applicable reasons for this movement
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries({
                      sample: "Sample",
                      offer: "Offer",
                      laboratoryTesting: "Laboratory: Testing & Trials",
                      commercialAction: "Commercial Action",
                      maintenance: "Maintenance or Repairs",
                      spillage: "Spillage",
                      equipmentWashing: "Equipment Washing",
                      damagedProducts: "Damaged Products",
                      nonConformingProducts: "Non-conforming Products",
                      transferBetweenWarehouses: "Transfer between Warehouses or Items",
                      inventoryAdjustmentPositive: "Inventory Adjustment – Positive (AJINV+)",
                      inventoryAdjustmentNegative: "Inventory Adjustment – Negative (AJINV–)",
                      productionLossGain: "Production Loss/Gain",
                      assetEnhancement: "Asset Enhancement",
                      ibcMovement: "IBC Movement",
                      others: "Others / Unclear",
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={formData.movementReasons?.[key as keyof MovementReason] || false}
                          onCheckedChange={(checked) => updateMovementReason(key as keyof MovementReason, checked as boolean)}
                          disabled={!canEdit}
                        />
                        <Label htmlFor={key} className="text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};