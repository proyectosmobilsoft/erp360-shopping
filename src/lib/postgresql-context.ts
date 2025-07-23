// Cliente PostgreSQL para reemplazar localStorage
// Todas las operaciones van directamente a tu servidor PostgreSQL

import { executeSQL } from './real-database';
import { Supplier } from '@/types';

// Interfaz para respuestas de PostgreSQL
interface PostgreSQLResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

// ========== FUNCIONES PARA SUPPLIERS ==========

export async function loadSuppliersFromPostgreSQL(): Promise<Supplier[]> {
  try {
    const sql = `
      SELECT 
        s.id::text,
        s.nit as "documentNumber",
        CASE 
          WHEN s.nit ~ '^[0-9]+$' THEN 'NIT'
          ELSE 'CC'
        END as "documentType",
        '' as "verificationDigit",
        s.name,
        s.email,
        s.phone,
        s.address,
        '' as "cityCode",
        s.city as "cityName", 
        '' as "departmentCode",
        s.department as "departmentName",
        s.contact_person as "contactPerson",
        30 as "paymentTerms",
        CASE 
          WHEN s.tax_contributor_type = 'REGIMEN_SIMPLE' THEN 'REGIMEN_SIMPLE'
          ELSE 'RESPONSABLE_IVA'
        END as "taxContributorType",
        s.status,
        s.tipo_persona as "tipoPersona",
        s.declarante_renta as "declaranteRenta",
        s.autoretenedor,
        s.inscrito_ica_local as "inscritoICALocal",
        s.tipo_transaccion_principal as "tipoTransaccionPrincipal",
        s.created_at as "createdAt",
        s.updated_at as "updatedAt"
      FROM suppliers s
      WHERE s.status = true
      ORDER BY s.created_at DESC;
    `;

    const result = await executeSQL(sql);
    
    if (result.success && result.data) {
      console.log('✅ Proveedores cargados desde PostgreSQL:', result.data.length);
      return result.data.map((row: any) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        conceptosRetencionAsignados: []
      }));
    } else {
      console.warn('⚠️ No se pudieron cargar proveedores desde PostgreSQL');
      return [];
    }
  } catch (error) {
    console.error('❌ Error cargando proveedores desde PostgreSQL:', error);
    return [];
  }
}

export async function saveSupplerToPostgreSQL(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    const sql = `
      BEGIN;

      -- 1. Crear empresa de prueba si no existe
      INSERT INTO companies (
        id,
        name,
        nit,
        address,
        city,
        department,
        phone,
        email,
        tax_regime,
        created_at,
        updated_at
      ) VALUES (
        '${companyId}',
        'MI EMPRESA DE PRUEBA SAS',
        '900123456-1',
        'Calle 123 #45-67',
        'Bogotá',
        'Cundinamarca',
        '601234567',
        'admin@miempresa.com',
        'ORDINARIO',
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;

      -- 2. Insertar el proveedor y retornar el ID
      INSERT INTO suppliers (
        id,
        company_id,
        name,
        nit,
        address,
        city,
        department,
        phone,
        email,
        contact_person,
        tax_contributor_type,
        tipo_persona,
        declarante_renta,
        autoretenedor,
        inscrito_ica_local,
        tipo_transaccion_principal,
        status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        '${companyId}',
        '${supplierData.name}',
        '${supplierData.documentNumber}',
        '${supplierData.address || ''}',
        '${supplierData.cityName || 'Bogotá'}',
        '${supplierData.departmentName || 'Cundinamarca'}',
        '${supplierData.phone || ''}',
        '${supplierData.email}',
        '${supplierData.contactPerson || ''}',
        '${supplierData.taxContributorType === 'REGIMEN_SIMPLE' ? 'REGIMEN_SIMPLE' : 'ORDINARIO'}',
        '${supplierData.tipoPersona || 'JURIDICA'}',
        ${supplierData.declaranteRenta ?? true},
        ${supplierData.autoretenedor ?? false},
        ${supplierData.inscritoICALocal ?? true},
        '${supplierData.tipoTransaccionPrincipal || 'AMBOS'}',
        true,
        NOW(),
        NOW()
      ) RETURNING id;

      COMMIT;
    `;

    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log('✅ Proveedor guardado en PostgreSQL');
      return { success: true, id: 'generated-id' };
    } else {
      console.error('❌ Error guardando proveedor:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error en saveSupplerToPostgreSQL:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSupplierInPostgreSQL(id: string, supplierData: Partial<Supplier>): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = [];
    
    if (supplierData.name) updates.push(`name = '${supplierData.name}'`);
    if (supplierData.email) updates.push(`email = '${supplierData.email}'`);
    if (supplierData.phone) updates.push(`phone = '${supplierData.phone}'`);
    if (supplierData.address) updates.push(`address = '${supplierData.address}'`);
    if (supplierData.cityName) updates.push(`city = '${supplierData.cityName}'`);
    if (supplierData.departmentName) updates.push(`department = '${supplierData.departmentName}'`);
    if (supplierData.contactPerson) updates.push(`contact_person = '${supplierData.contactPerson}'`);
    if (supplierData.taxContributorType) {
      const taxType = supplierData.taxContributorType === 'REGIMEN_SIMPLE' ? 'REGIMEN_SIMPLE' : 'ORDINARIO';
      updates.push(`tax_contributor_type = '${taxType}'`);
    }
    if (supplierData.tipoPersona) updates.push(`tipo_persona = '${supplierData.tipoPersona}'`);
    if (supplierData.declaranteRenta !== undefined) updates.push(`declarante_renta = ${supplierData.declaranteRenta}`);
    if (supplierData.autoretenedor !== undefined) updates.push(`autoretenedor = ${supplierData.autoretenedor}`);
    if (supplierData.inscritoICALocal !== undefined) updates.push(`inscrito_ica_local = ${supplierData.inscritoICALocal}`);
    if (supplierData.tipoTransaccionPrincipal) updates.push(`tipo_transaccion_principal = '${supplierData.tipoTransaccionPrincipal}'`);
    if (supplierData.status !== undefined) updates.push(`status = ${supplierData.status}`);
    
    updates.push(`updated_at = NOW()`);

    const sql = `
      UPDATE suppliers 
      SET ${updates.join(', ')}
      WHERE id::text = '${id}';
    `;

    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log('✅ Proveedor actualizado en PostgreSQL');
      return { success: true };
    } else {
      console.error('❌ Error actualizando proveedor:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error en updateSupplierInPostgreSQL:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSupplierFromPostgreSQL(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = `
      UPDATE suppliers 
      SET status = false, updated_at = NOW()
      WHERE id::text = '${id}';
    `;

    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log('✅ Proveedor eliminado (desactivado) en PostgreSQL');
      return { success: true };
    } else {
      console.error('❌ Error eliminando proveedor:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error en deleteSupplierFromPostgreSQL:', error);
    return { success: false, error: error.message };
  }
}

// ========== FUNCIONES PARA OTROS MÓDULOS ==========
// Se pueden agregar más funciones aquí para PurchaseOrders, Invoices, etc.

export async function testPostgreSQLConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await executeSQL('SELECT version(), now() as current_time;');
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Conexión exitosa a PostgreSQL' 
      };
    } else {
      return { 
        success: false, 
        message: `Error de conexión: ${result.error}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Error de conexión: ${error.message}` 
    };
  }
}