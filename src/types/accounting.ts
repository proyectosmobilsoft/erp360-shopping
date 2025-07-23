export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  subtype: string;
  isActive: boolean;
  requiresThirdParty: boolean;
  requiresCostCenter: boolean;
  level: number;
}

export interface ThirdParty {
  id: string;
  code: string;
  name: string;
  nit: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'EMPLOYEE' | 'OTHER';
  isActive: boolean;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface AccountingSeat {
  id: string;
  seatNumber: string;
  date: string;
  description: string;
  sourceDocument: string;
  documentNumber: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdBy: string;
  createdAt: string;
  entries: AccountingEntry[];
}

export interface AccountingEntry {
  id: string;
  seatId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  thirdPartyId?: string;
  thirdPartyName?: string;
  costCenterId?: string;
  costCenterName?: string;
  sequence: number;
}

export interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  isOpen: boolean;
  closedDate?: string;
  closedBy?: string;
}

export interface AccountingSource {
  id: string;
  code: string;
  name: string;
  prefix: string;
  isActive: boolean;
}

export interface ConsecutiveControl {
  id: string;
  sourceId: string;
  year: number;
  lastNumber: number;
  prefix: string;
}

export interface PurchaseAccountingConfig {
  inventoryAccount: string;
  vatAccount: string;
  retentionFuenteAccount: string;
  retentionIvaAccount: string;
  retentionIcaAccount: string;
  suppliersAccount: string;
  cashAccount: string;
  fixedAssetsAccount: string;
}

export interface AccountingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface JournalEntryTemplate {
  type: 'INVENTORY_PURCHASE' | 'FIXED_ASSET_PURCHASE' | 'EXPENSE_PURCHASE';
  entries: JournalEntryTemplateItem[];
}

export interface JournalEntryTemplateItem {
  accountCode: string;
  accountName: string;
  debitFormula?: string;
  creditFormula?: string;
  description: string;
  requiresThirdParty: boolean;
  requiresCostCenter: boolean;
}