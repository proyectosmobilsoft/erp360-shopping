import React from 'react';
import { 
  AccountingAccount, 
  ThirdParty, 
  CostCenter, 
  AccountingSeat, 
  AccountingEntry,
  AccountingPeriod,
  AccountingValidation,
  PurchaseAccountingConfig,
  JournalEntryTemplate
} from '@/types/accounting';
import { Invoice } from '@/types';

export class AccountingEngine {
  private accounts: AccountingAccount[] = [];
  private thirdParties: ThirdParty[] = [];
  private costCenters: CostCenter[] = [];
  private periods: AccountingPeriod[] = [];
  private config: PurchaseAccountingConfig;

  constructor(config: PurchaseAccountingConfig) {
    this.config = config;
    this.initializeDefaultAccounts();
    this.initializeDefaultPeriods();
    this.initializeDefaultThirdParties();
  }

  private initializeDefaultAccounts() {
    this.accounts = [
      // Activos
      { id: '1', code: '143501', name: 'Inventarios - Mercancías', type: 'ASSET', subtype: 'CURRENT', isActive: true, requiresThirdParty: false, requiresCostCenter: false, level: 6 },
      { id: '2', code: '152001', name: 'Maquinaria y Equipo', type: 'ASSET', subtype: 'FIXED', isActive: true, requiresThirdParty: false, requiresCostCenter: false, level: 6 },
      { id: '3', code: '240810', name: 'IVA Descontable', type: 'ASSET', subtype: 'CURRENT', isActive: true, requiresThirdParty: false, requiresCostCenter: false, level: 6 },
      
      // Pasivos
      { id: '4', code: '220501', name: 'Proveedores Nacionales', type: 'LIABILITY', subtype: 'CURRENT', isActive: true, requiresThirdParty: true, requiresCostCenter: false, level: 6 },
      { id: '5', code: '236540', name: 'Retención en la Fuente por Pagar', type: 'LIABILITY', subtype: 'CURRENT', isActive: true, requiresThirdParty: true, requiresCostCenter: false, level: 6 },
      { id: '6', code: '236505', name: 'Retención de IVA por Pagar', type: 'LIABILITY', subtype: 'CURRENT', isActive: true, requiresThirdParty: true, requiresCostCenter: false, level: 6 },
      { id: '7', code: '236805', name: 'Retención de ICA por Pagar', type: 'LIABILITY', subtype: 'CURRENT', isActive: true, requiresThirdParty: true, requiresCostCenter: false, level: 6 },
      
      // Bancos
      { id: '8', code: '111001', name: 'Bancos - Cuenta Corriente', type: 'ASSET', subtype: 'CURRENT', isActive: true, requiresThirdParty: false, requiresCostCenter: false, level: 6 }
    ];
  }

  private initializeDefaultPeriods() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Crear períodos para el año actual
    for (let month = 1; month <= 12; month++) {
      this.periods.push({
        id: `${currentYear}-${month.toString().padStart(2, '0')}`,
        year: currentYear,
        month: month,
        isOpen: month <= currentMonth + 1 // Períodos actuales y siguiente mes abiertos
      });
    }
  }

  private initializeDefaultThirdParties() {
    // Inicializar terceros por defecto para pruebas
    this.thirdParties = [
      {
        id: 'default-supplier',
        documentType: 'NIT',
        documentNumber: '900000000',
        name: 'Proveedor de Prueba',
        isActive: true,
        isSupplier: true,
        isCustomer: false,
        address: 'Dirección por defecto',
        phone: '3001234567',
        email: 'proveedor@ejemplo.com'
      }
    ];
  }

  // Validaciones previas a la contabilización
  public validatePrerequisites(invoice: Invoice): AccountingValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar período contable abierto
    const invoiceDate = new Date(invoice.invoiceDate);
    const period = this.periods.find(p => 
      p.year === invoiceDate.getFullYear() && 
      p.month === invoiceDate.getMonth() + 1
    );

    if (!period) {
      errors.push(`No existe período contable para ${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`);
    } else if (!period.isOpen) {
      errors.push(`El período contable ${period.year}-${period.month.toString().padStart(2, '0')} está cerrado`);
    }

    // Validar existencia de cuentas contables
    const requiredAccounts = [
      this.config.inventoryAccount,
      this.config.vatAccount,
      this.config.suppliersAccount,
      this.config.retentionFuenteAccount,
      this.config.retentionIvaAccount,
      this.config.retentionIcaAccount
    ];

    for (const accountCode of requiredAccounts) {
      const account = this.accounts.find(a => a.code === accountCode);
      if (!account) {
        errors.push(`No existe la cuenta contable ${accountCode}`);
      } else if (!account.isActive) {
        errors.push(`La cuenta contable ${accountCode} - ${account.name} está inactiva`);
      }
    }

    // Validar tercero (proveedor) - más flexible para pruebas
    const supplier = this.thirdParties.find(t => t.id === invoice.supplierId);
    if (!supplier) {
      // Para pruebas, crear un proveedor temporal si no existe
      this.thirdParties.push({
        id: invoice.supplierId,
        documentType: 'NIT',
        documentNumber: invoice.supplierNit || '900000000',
        name: invoice.supplierName || 'Proveedor Temporal',
        isActive: true,
        isSupplier: true,
        isCustomer: false,
        address: 'Dirección temporal',
        phone: '3001234567',
        email: 'temp@ejemplo.com'
      });
      warnings.push(`Se creó automáticamente el tercero para el proveedor ${invoice.supplierName}`);
    } else if (!supplier.isActive) {
      errors.push(`El proveedor ${supplier.name} está inactivo`);
    }

    // Validar que la factura tenga montos válidos
    const subtotal = invoice.subtotal || 0;
    const totalTax = invoice.totalTax || 0;
    const total = invoice.total || 0;
    
    if (subtotal <= 0) {
      errors.push('La factura debe tener un subtotal mayor a cero');
    }
    
    if (total <= 0) {
      errors.push('La factura debe tener un total mayor a cero');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Generar asiento contable para compra de inventarios
  public generateInventoryPurchaseEntry(invoice: Invoice): AccountingSeat {
    const supplier = this.thirdParties.find(t => t.id === invoice.supplierId);
    const subtotal = invoice.subtotal || 0;
    const vatAmount = invoice.totalTax || 0;
    const retentionFuente = invoice.retentionFuente || 0;
    const retentionIVA = invoice.retentionIVA || 0;
    const retentionICA = invoice.retentionICA || 0;
    const netPayable = invoice.total || 0;

    const entries: AccountingEntry[] = [
      // Débito: Inventarios
      {
        id: '1',
        seatId: '',
        accountCode: this.config.inventoryAccount,
        accountName: 'Inventarios - Mercancías',
        description: `Compra de mercancía según factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: subtotal,
        creditAmount: 0,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: 1
      },
      // Débito: IVA Descontable
      {
        id: '2',
        seatId: '',
        accountCode: this.config.vatAccount,
        accountName: 'IVA Descontable',
        description: `IVA factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: vatAmount,
        creditAmount: 0,
        sequence: 2
      }
    ];

    let sequence = 3;

    // Crédito: Retención en la Fuente
    if (retentionFuente > 0) {
      entries.push({
        id: sequence.toString(),
        seatId: '',
        accountCode: this.config.retentionFuenteAccount,
        accountName: 'Retención en la Fuente por Pagar',
        description: `Retefuente factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: 0,
        creditAmount: retentionFuente,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: sequence++
      });
    }

    // Crédito: Retención de IVA
    if (retentionIVA > 0) {
      entries.push({
        id: sequence.toString(),
        seatId: '',
        accountCode: this.config.retentionIvaAccount,
        accountName: 'Retención de IVA por Pagar',
        description: `ReteIVA factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: 0,
        creditAmount: retentionIVA,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: sequence++
      });
    }

    // Crédito: Retención de ICA
    if (retentionICA > 0) {
      entries.push({
        id: sequence.toString(),
        seatId: '',
        accountCode: this.config.retentionIcaAccount,
        accountName: 'Retención de ICA por Pagar',
        description: `ReteICA factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: 0,
        creditAmount: retentionICA,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: sequence++
      });
    }

    // Crédito: Proveedores
    entries.push({
      id: sequence.toString(),
      seatId: '',
      accountCode: this.config.suppliersAccount,
      accountName: 'Proveedores Nacionales',
      description: `Por pagar factura ${invoice.supplierInvoiceNumber}`,
      debitAmount: 0,
      creditAmount: netPayable,
      thirdPartyId: supplier?.id,
      thirdPartyName: supplier?.name,
      sequence: sequence
    });

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);

    return {
      id: '',
      seatNumber: '',
      date: invoice.invoiceDate,
      description: `Compra de mercancía - Factura ${invoice.supplierInvoiceNumber}`,
      sourceDocument: 'FACTURA_COMPRA',
      documentNumber: invoice.supplierInvoiceNumber,
      totalDebit,
      totalCredit,
      isPosted: false,
      createdBy: invoice.processedBy,
      createdAt: new Date().toISOString(),
      entries
    };
  }

  // Generar asiento contable para compra de activos fijos
  public generateFixedAssetPurchaseEntry(invoice: Invoice): AccountingSeat {
    const supplier = this.thirdParties.find(t => t.id === invoice.supplierId);
    const assetValue = invoice.subtotal || 0;
    const vatAmount = invoice.totalTax || 0;
    const retentionFuente = invoice.retentionFuente || 0;
    const netPayable = invoice.total || 0;

    const entries: AccountingEntry[] = [
      // Débito: Activo Fijo (valor del activo)
      {
        id: '1',
        seatId: '',
        accountCode: this.config.fixedAssetsAccount,
        accountName: 'Maquinaria y Equipo',
        description: `Compra de activo fijo según factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: assetValue,
        creditAmount: 0,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: 1
      },
      // Débito: Activo Fijo (IVA como mayor valor del activo)
      {
        id: '2',
        seatId: '',
        accountCode: this.config.fixedAssetsAccount,
        accountName: 'Maquinaria y Equipo - IVA Mayor Valor',
        description: `IVA mayor valor activo factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: vatAmount,
        creditAmount: 0,
        sequence: 2
      }
    ];

    let sequence = 3;

    // Crédito: Retención en la Fuente
    if (retentionFuente > 0) {
      entries.push({
        id: sequence.toString(),
        seatId: '',
        accountCode: this.config.retentionFuenteAccount,
        accountName: 'Retención en la Fuente por Pagar',
        description: `Retefuente factura ${invoice.supplierInvoiceNumber}`,
        debitAmount: 0,
        creditAmount: retentionFuente,
        thirdPartyId: supplier?.id,
        thirdPartyName: supplier?.name,
        sequence: sequence++
      });
    }

    // Crédito: Proveedores
    entries.push({
      id: sequence.toString(),
      seatId: '',
      accountCode: this.config.suppliersAccount,
      accountName: 'Proveedores Nacionales',
      description: `Por pagar factura ${invoice.supplierInvoiceNumber}`,
      debitAmount: 0,
      creditAmount: netPayable,
      thirdPartyId: supplier?.id,
      thirdPartyName: supplier?.name,
      sequence: sequence
    });

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);

    return {
      id: '',
      seatNumber: '',
      date: invoice.invoiceDate,
      description: `Compra de activo fijo - Factura ${invoice.supplierInvoiceNumber}`,
      sourceDocument: 'FACTURA_COMPRA',
      documentNumber: invoice.supplierInvoiceNumber,
      totalDebit,
      totalCredit,
      isPosted: false,
      createdBy: invoice.processedBy,
      createdAt: new Date().toISOString(),
      entries
    };
  }

  // Obtener cuentas contables
  public getAccounts(): AccountingAccount[] {
    return this.accounts;
  }

  // Obtener terceros
  public getThirdParties(): ThirdParty[] {
    return this.thirdParties;
  }

  // Obtener centros de costo
  public getCostCenters(): CostCenter[] {
    return this.costCenters;
  }

  // Obtener períodos contables
  public getPeriods(): AccountingPeriod[] {
    return this.periods;
  }
}

export default AccountingEngine;