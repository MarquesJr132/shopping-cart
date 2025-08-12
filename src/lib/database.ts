export interface MovementItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: 'Kg' | 'Liter' | 'Unit';
  batchNumber: string;
  costCenter: string;
  internalCostCenter: string;
  movementType: '+' | '-';
}

export interface MovementReason {
  sample: boolean;
  offer: boolean;
  laboratoryTesting: boolean;
  commercialAction: boolean;
  maintenance: boolean;
  spillage: boolean;
  equipmentWashing: boolean;
  damagedProducts: boolean;
  nonConformingProducts: boolean;
  transferBetweenWarehouses: boolean;
  inventoryAdjustmentPositive: boolean;
  inventoryAdjustmentNegative: boolean;
  productionLossGain: boolean;
  assetEnhancement: boolean;
  ibcMovement: boolean;
  others: boolean;
}

export interface Approval {
  approvedBy: string;
  approverName: string;
  approverRole: string;
  approvedAt: string;
  comments?: string;
}

export interface MaterialMovement {
  id: string;
  journalName: string;
  journalNumber: string;
  date: string;
  reason: string;
  requestType: 'material_movement' | 'shopping_card';
  // Shopping card specific fields
  shoppingCardType?: 'Service' | 'Material';
  deliveryDate?: string;
  preferredSupplier?: string;
  clientName?: string;
  clientId?: string;
  items: MovementItem[];
  movementReasons: MovementReason;
  status: 'draft' | 'pending_manager_approval' | 'pending_final_approval' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  managerApproval?: Approval;
  finalApproval?: Approval;
  warehouseCompletion?: {
    completedBy: string;
    completedByName: string;
    completedAt: string;
    notes?: string;
  };
  rejectionReason?: string;
}

const STORAGE_KEY = 'materialMovements';

export const getMovements = (): MaterialMovement[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const movements = data ? JSON.parse(data) : [];
    console.log('Retrieved movements from localStorage:', movements);
    return movements;
  } catch (error) {
    console.error('Error reading movements from localStorage:', error);
    return [];
  }
};

export const saveMovement = (movement: MaterialMovement): void => {
  try {
    const movements = getMovements();
    const existingIndex = movements.findIndex(m => m.id === movement.id);
    
    if (existingIndex >= 0) {
      movements[existingIndex] = movement;
      console.log('Updated existing movement:', movement);
    } else {
      movements.push(movement);
      console.log('Added new movement:', movement);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
    console.log('Movements saved to localStorage. Total count:', movements.length);
  } catch (error) {
    console.error('Error saving movement to localStorage:', error);
    throw error;
  }
};

export const getMovementById = (id: string): MaterialMovement | null => {
  const movements = getMovements();
  return movements.find(m => m.id === id) || null;
};

export const deleteMovement = (id: string): void => {
  const movements = getMovements();
  const filtered = movements.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const generateJournalNumber = (): string => {
  const movements = getMovements();
  const currentYear = new Date().getFullYear();
  const yearMovements = movements.filter(m => 
    new Date(m.date).getFullYear() === currentYear
  );
  const nextNumber = yearMovements.length + 1;
  return `MM${currentYear}${nextNumber.toString().padStart(4, '0')}`;
};