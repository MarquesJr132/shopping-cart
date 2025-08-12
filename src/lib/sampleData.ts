import { MaterialMovement } from "./database";

export const sampleMovements: MaterialMovement[] = [
  {
    id: "1",
    journalName: "Material Movement",
    journalNumber: "MM20240001",
    date: "2024-01-15",
    reason: "Sample for potential client demonstration and testing",
    requestType: "material_movement" as const,
    clientName: "ABC Construction Ltd",
    clientId: "ABC001",
    items: [
      {
        id: "1",
        itemCode: "SKA-001",
        description: "Sikaflex-1a Polyurethane Sealant",
        quantity: 5,
        unit: "Unit",
        batchNumber: "LOT2024001",
        costCenter: "01",
        internalCostCenter: "010001",
        movementType: "-"
      }
    ],
    movementReasons: {
      sample: true,
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
    status: "completed",
    requestedBy: "2",
    requestedByName: "Joana Sales",
    requestedAt: "2024-01-15T08:30:00Z",
    managerApproval: {
      approvedBy: "4",
      approverName: "Miguel Sales Lead",
      approverRole: "sales_manager",
      approvedAt: "2024-01-15T10:15:00Z",
      comments: "Approved for client demo"
    },
    finalApproval: {
      approvedBy: "5",
      approverName: "General Manager",
      approverRole: "general_manager",
      approvedAt: "2024-01-15T14:20:00Z"
    },
    warehouseCompletion: {
      completedBy: "7",
      completedByName: "Warehouse Staff",
      completedAt: "2024-01-15T16:45:00Z",
      notes: "Items dispatched for client demonstration"
    }
  },
  {
    id: "2",
    journalName: "Material Movement",
    journalNumber: "MM20240002",
    date: "2024-01-20",
    reason: "Laboratory testing for quality control batch verification",
    requestType: "material_movement" as const,
    items: [
      {
        id: "2",
        itemCode: "SKA-002",
        description: "SikaTop-122 Repair Mortar",
        quantity: 2,
        unit: "Kg",
        batchNumber: "LOT2024005",
        costCenter: "02",
        internalCostCenter: "020001",
        movementType: "-"
      }
    ],
    movementReasons: {
      sample: false,
      offer: false,
      laboratoryTesting: true,
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
    status: "approved",
    requestedBy: "1",
    requestedByName: "Junior José",
    requestedAt: "2024-01-20T09:00:00Z",
    managerApproval: {
      approvedBy: "3",
      approverName: "Bragança Carla",
      approverRole: "manager",
      approvedAt: "2024-01-20T11:30:00Z"
    },
    finalApproval: {
      approvedBy: "6",
      approverName: "Finance Controller",
      approverRole: "controller",
      approvedAt: "2024-01-20T15:10:00Z"
    }
  },
  {
    id: "3",
    journalName: "Shopping Card",
    journalNumber: "SC20240001",
    date: "2024-01-22",
    reason: "Office supplies needed for new project",
    requestType: "shopping_card" as const,
    items: [
      {
        id: "3",
        itemCode: "",
        description: "Office chairs for meeting room",
        quantity: 4,
        unit: "Unit",
        batchNumber: "",
        costCenter: "",
        internalCostCenter: "",
        movementType: "+"
      },
      {
        id: "4",
        itemCode: "",
        description: "Whiteboard markers - various colors",
        quantity: 20,
        unit: "Unit",
        batchNumber: "",
        costCenter: "",
        internalCostCenter: "",
        movementType: "+"
      }
    ],
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
    status: "pending_manager_approval",
    requestedBy: "1",
    requestedByName: "Junior José",
    requestedAt: "2024-01-22T10:30:00Z"
  }
];

export const initializeSampleData = () => {
  const existingData = localStorage.getItem('materialMovements');
  if (!existingData) {
    localStorage.setItem('materialMovements', JSON.stringify(sampleMovements));
  }
};