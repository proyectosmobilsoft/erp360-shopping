import { Pool } from 'pg';

const pool = new Pool({
  host: '179.33.214.86',  
  port: 5432,
  user: 'Developer',
  password: 'X3c1970213@mam@',
  database: 'erp_saas_colombiano',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface Supplier {
  id: string;
  nombre: string;
  nit: string;
  telefono?: string;
  email: string;
  direccion?: string;
  ciudad?: string;
  contacto?: string;
  categoria?: string;
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

export const databaseVPS = {
  // Listar todos los proveedores
  async getSuppliers(): Promise<Supplier[]> {
    try {
      console.log('🔄 Conectando a PostgreSQL VPS para obtener proveedores...');
      const result = await pool.query(`
        SELECT id, nombre, nit, telefono, email, direccion, ciudad, 
               contacto, categoria, estado, fecha_registro
        FROM proveedores 
        ORDER BY fecha_registro DESC
      `);
      
      console.log('✅ Proveedores obtenidos desde VPS PostgreSQL:', result.rows.length);
      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo proveedores desde VPS:', error);
      throw error;
    }
  },

  // Crear nuevo proveedor
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'fecha_registro'>): Promise<Supplier> {
    try {
      console.log('🔄 Creando proveedor en PostgreSQL VPS...', supplierData);
      
      const result = await pool.query(`
        INSERT INTO proveedores (nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro
      `, [
        supplierData.nombre,
        supplierData.nit,
        supplierData.telefono || null,
        supplierData.email,
        supplierData.direccion || null,
        supplierData.ciudad || null,
        supplierData.contacto || null,
        supplierData.categoria || null,
        supplierData.estado || 'activo'
      ]);

      console.log('✅ Proveedor creado en VPS PostgreSQL:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creando proveedor en VPS:', error);
      throw error;
    }
  },

  // Actualizar proveedor
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    try {
      console.log('🔄 Actualizando proveedor en PostgreSQL VPS...', id, supplierData);
      
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (supplierData.nombre !== undefined) {
        fields.push(`nombre = $${paramCount++}`);
        values.push(supplierData.nombre);
      }
      if (supplierData.nit !== undefined) {
        fields.push(`nit = $${paramCount++}`);
        values.push(supplierData.nit);
      }
      if (supplierData.telefono !== undefined) {
        fields.push(`telefono = $${paramCount++}`);
        values.push(supplierData.telefono);
      }
      if (supplierData.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(supplierData.email);
      }
      if (supplierData.direccion !== undefined) {
        fields.push(`direccion = $${paramCount++}`);
        values.push(supplierData.direccion);
      }
      if (supplierData.ciudad !== undefined) {
        fields.push(`ciudad = $${paramCount++}`);
        values.push(supplierData.ciudad);
      }
      if (supplierData.contacto !== undefined) {
        fields.push(`contacto = $${paramCount++}`);
        values.push(supplierData.contacto);
      }
      if (supplierData.categoria !== undefined) {
        fields.push(`categoria = $${paramCount++}`);
        values.push(supplierData.categoria);
      }
      if (supplierData.estado !== undefined) {
        fields.push(`estado = $${paramCount++}`);
        values.push(supplierData.estado);
      }

      values.push(id);

      const result = await pool.query(`
        UPDATE proveedores 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, nombre, nit, telefono, email, direccion, ciudad, contacto, categoria, estado, fecha_registro
      `, values);

      if (result.rows.length === 0) {
        console.log('❌ Proveedor no encontrado para actualizar:', id);
        return null;
      }

      console.log('✅ Proveedor actualizado en VPS PostgreSQL:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando proveedor en VPS:', error);
      throw error;
    }
  },

  // Eliminar proveedor
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      console.log('🔄 Eliminando proveedor en PostgreSQL VPS...', id);
      
      const result = await pool.query(`
        DELETE FROM proveedores 
        WHERE id = $1
        RETURNING id
      `, [id]);

      const success = result.rows.length > 0;
      console.log(success ? '✅ Proveedor eliminado de VPS PostgreSQL' : '❌ Proveedor no encontrado para eliminar');
      return success;
    } catch (error) {
      console.error('❌ Error eliminando proveedor en VPS:', error);
      throw error;
    }
  }
};

// Test de conexión
export const testVPSConnection = async (): Promise<boolean> => {
  try {
    console.log('🔄 Probando conexión a PostgreSQL VPS...');
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Conexión exitosa a VPS PostgreSQL:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a VPS PostgreSQL:', error);
    return false;
  }
};