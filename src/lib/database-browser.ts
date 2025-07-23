// Browser-compatible database interface that calls the server-side API
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

// Browser-safe database operations using fetch to server API
export const databaseVPS = {
  async getSuppliers(): Promise<Supplier[]> {
    try {
      console.log('🔄 Obteniendo proveedores desde VPS via API...');
      const response = await fetch('/api/suppliers');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error obteniendo proveedores');
      }
      
      console.log('✅ Proveedores obtenidos desde VPS:', result.data.length);
      return result.data;
    } catch (error) {
      console.error('❌ Error obteniendo proveedores:', error);
      throw error;
    }
  },

  async createSupplier(supplierData: Omit<Supplier, 'id' | 'fecha_registro'>): Promise<Supplier> {
    try {
      console.log('🔄 Creando proveedor en VPS via API...', supplierData);
      
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error creando proveedor');
      }
      
      console.log('✅ Proveedor creado en VPS:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creando proveedor:', error);
      throw error;
    }
  },

  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
    try {
      console.log('🔄 Actualizando proveedor en VPS via API...', id, supplierData);
      
      const response = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...supplierData }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.error || 'Error actualizando proveedor');
      }
      
      console.log('✅ Proveedor actualizado en VPS:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error actualizando proveedor:', error);
      throw error;
    }
  },

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      console.log('🔄 Eliminando proveedor en VPS via API...', id);
      
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return false;
        }
        throw new Error(result.error || 'Error eliminando proveedor');
      }
      
      console.log('✅ Proveedor eliminado en VPS');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando proveedor:', error);
      throw error;
    }
  }
};

// Browser-safe connection test
export async function testVPSConnection(): Promise<boolean> {
  try {
    console.log('🔄 Probando conexión VPS via API...');
    const response = await fetch('/api/suppliers');
    const result = await response.json();
    console.log('✅ Conexión VPS exitosa via API');
    return result.success;
  } catch (error) {
    console.error('❌ Error conectando a VPS via API:', error);
    return false;
  }
}