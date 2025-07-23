export interface Supplier {
  id: string;
  documentType: 'NIT' | 'CC' | 'CE' | 'PAS' | 'TI' | 'RC';
  documentNumber: string;
  verificationDigit?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cityCode: string;
  cityName: string;
  departmentCode: string;
  departmentName: string;
  contactPerson: string;
  paymentTerms: number;
  taxContributorType?: 'RESPONSABLE_IVA' | 'NO_RESPONSABLE_IVA' | 'REGIMEN_SIMPLE';
  status: boolean;
  // Nuevos campos para matriz de retenciones
  declaranteRenta?: boolean; // Si es declarante de renta
  tipoPersona?: 'NATURAL' | 'JURIDICA'; // Tipo de persona
  tipoTransaccionPrincipal?: 'BIENES' | 'SERVICIOS' | 'AMBOS'; // Tipo principal de transacciones
  inscritoICALocal?: boolean; // Si está inscrito en ICA local
  conceptosRetencionAsignados?: string[]; // IDs de conceptos de retención asignados
  autoretenedor?: boolean; // Si es autoretenedor
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  expeditionDate: string;
  consecutive: string;
  supplierId: string;
  supplierName: string;
  supplierNit: string;
  supplierAddress: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierTaxRegime: string;
  items: PurchaseOrderItem[];
  documents: PurchaseOrderDocument[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  total: number;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'RECEIVED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  receivedQuantity: number;
  invoicedQuantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export interface MovementConcept {
  id: string;
  code: string;
  name: string;
  movementType: 'ENTRADA' | 'SALIDA';
  isActive: boolean;
  createdAt: Date;
}

export interface WarehouseEntry {
  id: string;
  entryNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  warehouseCode: string;
  warehouseName: string;
  entryDate: Date;
  receivedBy: string;
  status: 'pending' | 'completed' | 'partial';
  items: WarehouseEntryItem[];
  notes?: string;
  createdAt: Date;
  createdByUser: string;
  terminal?: string;
  emailSent: boolean;
}

export interface WarehouseEntryItem {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  condition: 'good' | 'damaged' | 'defective';
  notes?: string;
}

export interface KardexEntry {
  id: string;
  productCode: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  movementType: 'ENTRADA' | 'SALIDA';
  conceptCode: string;
  conceptName: string;
  documentNumber: string;
  documentType: 'ORDEN_COMPRA' | 'FACTURA' | 'DEVOLUCION' | 'AJUSTE';
  supplierId?: string;
  supplierNit?: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  movementDate: Date;
  createdBy: string;
  createdAt: Date;
  terminal?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  supplierInvoiceNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  supplierNit: string;
  warehouseCode: string;
  warehouseName: string;
  invoiceDate: string;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  retentionICA: number;
  retentionFuente: number;
  retentionIVA: number;
  retentionCREE: number;
  totalRetentions: number;
  total: number;
  processedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: string;
  isAccounted?: boolean;
}

export interface InvoiceItem {
  id: string;
  productCode: string;
  productName: string;
  unit: string;
  receivedQuantity: number;
  invoicedQuantity: number;
  alreadyInvoicedQuantity?: number;
  returnedQuantity?: number; // Cantidad devuelta acumulada
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  type: 'supplier' | 'customer';
  supplierId?: string;
  supplier?: Supplier;
  returnDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'processed';
  items: ReturnItem[];
  creditNoteNumber?: string;
  total: number;
  createdAt: Date;
}

export interface ReturnItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: string;
}

export interface PurchaseOrderTracking {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  warehouseEntryId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  quantityReceived: number;
  quantityInvoiced: number;
  unitPrice: number;
  totalReceived: number;
  totalInvoiced: number;
  status: 'received' | 'invoiced' | 'both';
  date: Date;
  notes?: string;
}

export interface DashboardKPI {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeSuppliers: number;
  monthlySpending: { month: string; amount: number }[];
  topSuppliers: { name: string; amount: number }[];
}