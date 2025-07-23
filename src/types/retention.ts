export interface RetentionConcept {
  id: string;
  codigo: string; // 3 caracteres
  nombre: string; // varchar(100)
  baseMinima: number; // decimal(10,2)
  tasaImpuesto: number; // decimal(10,2) - porcentaje
  cuentaContable: string; // llave foránea
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface TaxRegime {
  id: string;
  codigo: string;
  nombre: string;
  esDeclarante: boolean;
  aplicaIVA: boolean;
  activo: boolean;
}

export interface Supplier {
  id: string;
  nit: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  regimenTributario: string; // FK a TaxRegime
  responsabilidadIVA: 'RESPONSABLE' | 'NO_RESPONSABLE';
  autoretenedor: boolean;
  // Nuevos campos para matriz de retenciones
  declaranteRenta: boolean; // Si es declarante de renta
  tipoPersona: 'NATURAL' | 'JURIDICA'; // Tipo de persona
  tipoTransaccionPrincipal: 'BIENES' | 'SERVICIOS' | 'AMBOS'; // Tipo principal de transacciones
  conceptosRetencionAsignados: string[]; // IDs de conceptos de retención asignados
  inscritoICALocal: boolean; // Si está inscrito en ICA local
  retencionesBienes: string[]; // FK array a RetentionConcept
  retencionesServicios: string[]; // FK array a RetentionConcept
  contactoPrincipal: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  activo: boolean;
}

export interface Company {
  id: string;
  nit: string;
  nombre: string;
  regimenTributario: string; // FK a TaxRegime
  esAgenteRetenedor: boolean;
  municipio: string;
  activo: boolean;
}

export interface AccountingAccount {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO' | 'COSTO';
  nivel: number;
  padre?: string;
  activo: boolean;
}

export interface AutomaticRetentionCalculation {
  conceptoRetencion: RetentionConcept;
  baseCalculo: number;
  valorRetencion: number;
  aplicable: boolean;
  razon?: string;
  cuentaContable: AccountingAccount;
}