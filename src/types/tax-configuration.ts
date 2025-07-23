export type RegimenTributario = 
  | 'DECLARANTE_RENTA'
  | 'NO_DECLARANTE_RENTA' 
  | 'PERSONA_JURIDICA'
  | 'PERSONA_NATURAL'
  | 'CUALQUIERA';

export type TipoTransaccion = 'BIENES' | 'SERVICIOS' | 'AMBOS';

export interface MatrizRetencion {
  id: string;
  concepto: string;
  regimenProveedor: RegimenTributario;
  tipoTransaccion: TipoTransaccion;
  baseMinimaUVT: number;
  baseMinimaPesos: number;
  porcRetefuente: number;
  porcReteIVA: number;
  porcReteICA: number;
  cuentaRetefuente: string;
  cuentaReteIVA: string;
  cuentaReteICA: string;
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface TaxConcept {
  id: string;
  codigo: string; // Código del impuesto (ej: "001", "002")
  nombre: string; // Nombre del concepto
  tipoImpuesto: 'RETEFUENTE' | 'RETEICA' | 'RETEIVA' | 'RETECREE' | 'IVA';
  tarifa: number; // Porcentaje del impuesto
  baseMinima: number; // Base mínima para aplicar
  cuentaContableCredito: string; // Cuenta contable crédito (retenciones solo usan crédito)
  regimenAplicable: RegimenTributario; // Régimen al que aplica
  tipoTransaccion: TipoTransaccion; // Tipo de transacción
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface SupplierTaxAssignment {
  supplierId: string;
  taxConceptIds: string[]; // Array de IDs de conceptos tributarios
  fechaAsignacion: Date;
  usuario: string;
}

export interface MassiveTaxAssignment {
  supplierIds: string[];
  taxConceptIds: string[];
  accion: 'ASIGNAR' | 'REMOVER';
  usuario: string;
  fecha: Date;
}

export interface TaxCalculationResult {
  concepto: TaxConcept;
  baseCalculo: number;
  valorImpuesto: number;
  aplicable: boolean;
  razon?: string;
}