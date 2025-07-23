import React, { createContext, useContext, useState, useEffect } from 'react';
import { PurchaseOrder, Product, Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Supplier } from '@/types';

interface DashboardKPI {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  activeSuppliers: number;
  monthlySpending: { month: string; amount: number; }[];
  topSuppliers: { name: string; amount: number; }[];
}

interface PurchasingContextType {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  invoices: Invoice[];
  dashboardKPI: DashboardKPI;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'fecha_registro'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

const PurchasingContext = createContext<PurchasingContextType | undefined>(undefined);

export function PurchasingProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Calculate dashboard KPIs
  const dashboardKPI = React.useMemo((): DashboardKPI => {
    const activeSuppliers = suppliers.filter(s => s.estado === 'activo').length;
    const pendingOrders = purchaseOrders.filter(o => o.status === 'draft' || o.status === 'sent').length;
    const totalSpent = purchaseOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Mock monthly spending data
    const monthlySpending = [
      { month: 'Ene', amount: 45000 },
      { month: 'Feb', amount: 52000 },
      { month: 'Mar', amount: 38000 },
      { month: 'Abr', amount: 67000 },
      { month: 'May', amount: 55000 },
      { month: 'Jun', amount: 71000 }
    ];

    // Calculate top suppliers
    const supplierSpending = suppliers.map(supplier => {
      const supplierOrders = purchaseOrders.filter(order => order.supplierId === supplier.id);
      const totalAmount = supplierOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      return { name: supplier.nombre, amount: totalAmount };
    }).filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      totalOrders: purchaseOrders.length,
      pendingOrders,
      totalSpent,
      activeSuppliers,
      monthlySpending,
      topSuppliers: supplierSpending
    };
  }, [suppliers, purchaseOrders]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Test VPS connection first
        const connectionOK = await testVPSConnection();
        if (!connectionOK) {
          throw new Error('No se pudo conectar al VPS PostgreSQL');
        }

        const loadedSuppliers = await databaseVPS.getSuppliers();
        setSuppliers(loadedSuppliers);
        console.log('✅ Proveedores cargados desde VPS PostgreSQL:', loadedSuppliers.length);
      } catch (error) {
        console.error('❌ Error cargando proveedores desde VPS:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar a la base de datos del VPS",
          variant: "destructive",
        });
      }
    };

    loadData();

    // Load other data from localStorage
    const storedOrders = localStorage.getItem('purchaseOrders');
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        setPurchaseOrders(parsed.map((order: any) => ({
          ...order,
          orderDate: new Date(order.orderDate),
          expectedDeliveryDate: new Date(order.expectedDeliveryDate),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        })));
      } catch (error) {
        console.warn('Error parsing stored orders:', error);
      }
    }

    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        setProducts(parsed.map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        })));
      } catch (error) {
        console.warn('Error parsing stored products:', error);
      }
    }

    const storedInvoices = localStorage.getItem('invoices');
    if (storedInvoices) {
      try {
        const parsed = JSON.parse(storedInvoices);
        setInvoices(parsed.map((invoice: any) => ({
          ...invoice,
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt)
        })));
      } catch (error) {
        console.warn('Error parsing stored invoices:', error);
      }
    }
  }, []);

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'fecha_registro'>) => {
    try {
      
      console.log('🔄 Creando proveedor mediante nueva API...', supplierData);
      
      // Asegurar que todos los campos requeridos tengan valores válidos
      const currentDate = new Date().toISOString();
      
      const body = {
        sql: "INSERT INTO compras.suppliers (name, nit, address, city, department, phone, email, contact_person, tipo_persona, declarante_renta, autoretenedor, inscrito_ica_local, tipo_transaccion_principal, is_active, created_at, updated_at, tax_contributor_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)",
        params: [
          supplierData.name || '',
          supplierData.nit || '',
          supplierData.address || '',
          supplierData.city || '',
          supplierData.department || '',
          supplierData.phone || '',
          supplierData.email || '',
          supplierData.contact_person || '',
          supplierData.tipo_persona || 'JURIDICA',
          supplierData.declarante_renta !== undefined ? supplierData.declarante_renta : false,
          supplierData.autoretenedor !== undefined ? supplierData.autoretenedor : false,
          supplierData.inscrito_ica_local !== undefined ? supplierData.inscrito_ica_local : false,
          supplierData.tipo_transaccion_principal || 'COMPRA',
          supplierData.is_active !== undefined ? supplierData.is_active : true,
          supplierData.created_at || currentDate,
          supplierData.updated_at || currentDate,
          supplierData.tax_contributor_type || 'GRAN_CONTRIBUYENTE'
        ]
      };
      
      console.log('📊 Datos a enviar:', body.params);
      
      const response = await fetch('http://api-master-saas.erpalimenta.com/api/table/dynamic-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        throw new Error('Error al procesar la respuesta del servidor');
      }

      // Verificar si la respuesta indica un error
      if (!response.ok || responseData.status === false) {
        const errorMessage = responseData?.mensaje || 'Error desconocido al crear proveedor';
        const errorDetails = responseData?.error || 'Detalles no disponibles';
        console.error(`❌ ${errorMessage}: ${errorDetails}`);
        throw new Error(`${errorMessage}: ${errorDetails}`);
      }

      const newSupplier = responseData;



      
      setSuppliers(prev => [newSupplier, ...prev]);
      
      toast({
        title: "✅ PROVEEDOR CREADO MEDIANTE NUEVA API",
        description: `Proveedor "${supplierData.name}" guardado exitosamente en la base de datos`,
      });
      
      console.log('✅ Proveedor creado mediante nueva API:', newSupplier);
    } catch (error) {
      console.error('❌ Error creando proveedor mediante nueva API:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el proveedor en la base de datos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      console.log('🔄 Actualizando proveedor DIRECTO en VPS PostgreSQL...', id, supplierData);
      
      const updatedSupplier = await databaseVPS.updateSupplier(id, supplierData);
      if (updatedSupplier) {
        setSuppliers(prev => prev.map(s => s.id === id ? updatedSupplier : s));
        toast({
          title: "✅ PROVEEDOR ACTUALIZADO DIRECTAMENTE EN VPS POSTGRESQL",
          description: "Proveedor actualizado exitosamente en la base de datos",
        });
        console.log('✅ Proveedor actualizado DIRECTO en VPS:', updatedSupplier);
      } else {
        throw new Error('Proveedor no encontrado en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error actualizando proveedor DIRECTO en VPS:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el proveedor en la base de datos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      console.log('🔄 Eliminando proveedor DIRECTO en VPS PostgreSQL...', id);
      
      const success = await databaseVPS.deleteSupplier(id);
      if (success) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
        toast({
          title: "✅ PROVEEDOR ELIMINADO DIRECTAMENTE DE VPS POSTGRESQL",
          description: "Proveedor eliminado exitosamente de la base de datos",
        });
        console.log('✅ Proveedor eliminado DIRECTO de VPS');
      } else {
        throw new Error('Proveedor no encontrado en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error eliminando proveedor DIRECTO de VPS:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor de la base de datos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addPurchaseOrder = (orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setPurchaseOrders(prev => [...prev, newOrder]);
  };

  const updatePurchaseOrder = (id: string, orderData: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...orderData, updatedAt: new Date() } : order
    ));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(order => order.id !== id));
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...productData, updatedAt: new Date() } : product
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setInvoices(prev => [...prev, newInvoice]);
  };

  const updateInvoice = (id: string, invoiceData: Partial<Invoice>) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === id ? { ...invoice, ...invoiceData, updatedAt: new Date() } : invoice
    ));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
  };

  return (
    <PurchasingContext.Provider value={{
      suppliers,
      purchaseOrders,
      products,
      invoices,
      dashboardKPI,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      addInvoice,
      updateInvoice,
      deleteInvoice
    }}>
      {children}
    </PurchasingContext.Provider>
  );
}

export function usePurchasing() {
  const context = useContext(PurchasingContext);
  if (context === undefined) {
    throw new Error('usePurchasing must be used within a PurchasingProvider');
  }
  return context;
}