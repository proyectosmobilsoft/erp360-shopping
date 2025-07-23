import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, RotateCcw, Package, FileText, Calculator, Receipt, History, CheckCircle } from 'lucide-react';
import { usePurchasing } from '@/contexts/PurchasingContext';
import { Invoice, InvoiceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ReturnItem extends InvoiceItem {
  returnQuantity: number;
  returnSubtotal: number;
  returnTaxAmount: number;
  returnTotal: number;
  availableToReturn: number;
}

const Returns = () => {
  const { invoices, suppliers, purchaseOrders, processReturn } = usePurchasing();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [processedSearchTerm, setProcessedSearchTerm] = useState('');
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnNotes, setReturnNotes] = useState('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<{
    id: string;
    creditNoteNumber: string;
    invoiceNumber: string;
    supplierName: string;
    returnDate: string;
    totalAmount: number;
    status: string;
    processedBy: string;
    items: Array<{
      productName: string;
      productCode: string;
      quantity: number;
      unitPrice: number;
    }>;
  } | null>(null);
  
  // Estado para manejar devoluciones procesadas
  const [processedReturns, setProcessedReturns] = useState([
    {
      id: 'ret-1',
      creditNoteNumber: 'NC-001',
      invoiceNumber: '8569',
      supplierName: 'Proveedor Ejemplo S.A.S.',
      returnDate: '2025-01-15',
      totalAmount: 250000,
      status: 'processed',
      processedBy: 'Juan Carlos Pérez',
      items: [
        { productName: 'Producto A', productCode: 'PROD-001', quantity: 2, unitPrice: 125000 }
      ]
    }
  ]);

  const currentUser = {
    name: 'Juan Carlos Pérez',
    email: 'jperez@empresa.com',
    role: 'Contador'
  };

  // Filtrar facturas para mostrar en el tablero de devoluciones
  // Una factura se mantiene disponible mientras tenga productos con cantidades disponibles para devolver
  const availableInvoices = invoices.filter(invoice => {
    // Verificar si la factura tiene al menos un producto con cantidad disponible para devolver
    return invoice.items.some(item => {
      const invoicedQty = item.invoicedQuantity || 0;
      const returnedQty = item.returnedQuantity || 0;
      const availableToReturn = Math.max(0, invoicedQty - returnedQty);
      return availableToReturn > 0;
    });
  });

  const filteredInvoices = availableInvoices.filter(invoice => {
    if (!searchTerm) return true;
    
    const supplier = suppliers.find(s => s.id === invoice.supplierId);
    const order = purchaseOrders.find(o => o.id === invoice.purchaseOrderId);
    
    return (
      invoice.supplierInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order?.consecutive.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.warehouseCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filtrar devoluciones procesadas
  const filteredProcessedReturns = processedReturns.filter(returnItem => {
    if (!processedSearchTerm) return true;
    
    return (
      returnItem.creditNoteNumber.toLowerCase().includes(processedSearchTerm.toLowerCase()) ||
      returnItem.invoiceNumber.toLowerCase().includes(processedSearchTerm.toLowerCase()) ||
      returnItem.supplierName.toLowerCase().includes(processedSearchTerm.toLowerCase()) ||
      returnItem.processedBy.toLowerCase().includes(processedSearchTerm.toLowerCase())
    );
  });

  const handleStartReturn = (invoice: Invoice) => {
    console.log('Factura seleccionada:', invoice);
    console.log('Items de factura:', invoice.items);
    
    setSelectedInvoice(invoice);
    const initialReturnItems = invoice.items.map(item => {
      const previousReturns = item.returnedQuantity || 0;
      const availableToReturn = Math.max(0, (item.invoicedQuantity || 0) - previousReturns);
      
      console.log(`Producto ${item.productCode}: Facturadas=${item.invoicedQuantity}, Devueltas=${previousReturns}, Disponible=${availableToReturn}`);
      
      return {
        ...item,
        returnQuantity: 0,
        returnSubtotal: 0,
        returnTaxAmount: 0,
        returnTotal: 0,
        availableToReturn
      };
    });
    setReturnItems(initialReturnItems);
    setReturnNotes('');
    setIsReturnDialogOpen(true);
  };

  const updateReturnItem = (index: number, returnQuantity: number) => {
    setReturnItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      // Controlar que no supere la cantidad disponible para devolver
      item.returnQuantity = Math.min(returnQuantity, item.availableToReturn);
      item.returnSubtotal = item.returnQuantity * (item.unitPrice || 0);
      
      const discountRate = item.discountRate || 0;
      const afterDiscount = item.returnSubtotal * (1 - discountRate / 100);
      item.returnTaxAmount = afterDiscount * ((item.taxRate || 0) / 100);
      item.returnTotal = afterDiscount + item.returnTaxAmount;
      
      updated[index] = item;
      return updated;
    });
  };

  const calculateReturnTotals = () => {
    const subtotal = returnItems.reduce((sum, item) => sum + item.returnSubtotal, 0);
    const totalDiscount = returnItems.reduce((sum, item) => {
      const discountRate = item.discountRate || 0;
      return sum + (item.returnSubtotal * discountRate / 100);
    }, 0);
    const totalTax = returnItems.reduce((sum, item) => sum + item.returnTaxAmount, 0);
    const total = returnItems.reduce((sum, item) => sum + item.returnTotal, 0);
    
    return { subtotal, totalDiscount, totalTax, total };
  };

  const handleProcessReturn = async () => {
    if (!selectedInvoice) return;
    
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast({
        title: "Error",
        description: "Debe especificar al menos un producto para devolver",
        variant: "destructive"
      });
      return;
    }

    // Validar que no se superen las cantidades disponibles
    const invalidItems = itemsToReturn.filter(item => item.returnQuantity > item.availableToReturn);
    if (invalidItems.length > 0) {
      toast({
        title: "Error de validación",
        description: "Algunas cantidades superan las disponibles para devolver",
        variant: "destructive"
      });
      return;
    }

    try {
      const totals = calculateReturnTotals();
      
      // Procesar la devolución
      const result = processReturn({
        invoiceId: selectedInvoice.id,
        items: itemsToReturn.map(item => ({
          productCode: item.productCode,
          returnQuantity: item.returnQuantity,
          returnTotal: item.returnTotal
        })),
        totalAmount: totals.total,
        notes: returnNotes,
        processedBy: currentUser.name
      });

      if (result.success) {
        // Crear el registro de devolución procesada
        const newProcessedReturn = {
          id: `ret-${Date.now()}`,
          creditNoteNumber: result.creditNoteNumber,
          invoiceNumber: selectedInvoice.supplierInvoiceNumber,
          supplierName: selectedInvoice.supplierName,
          returnDate: new Date().toISOString().split('T')[0],
          totalAmount: totals.total,
          status: 'processed' as const,
          processedBy: currentUser.name,
          items: itemsToReturn.map(item => ({
            productName: item.productName,
            productCode: item.productCode,
            quantity: item.returnQuantity,
            unitPrice: item.unitPrice || 0
          }))
        };

        // Agregar a devoluciones procesadas
        setProcessedReturns(prev => [newProcessedReturn, ...prev]);

        toast({
          title: "✅ Devolución procesada exitosamente",
          description: `Nota crédito ${result.creditNoteNumber} generada por $${result.totalAmount.toLocaleString()}`,
        });

        setIsReturnDialogOpen(false);
        resetReturnForm();
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la devolución",
        variant: "destructive"
      });
    }
  };

  const resetReturnForm = () => {
    setSelectedInvoice(null);
    setReturnItems([]);
    setReturnNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Devoluciones a Proveedores</h1>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-2">
          <TabsTrigger 
            value="available" 
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-orange-600"
          >
            <RotateCcw className="h-4 w-4" />
            Facturas Disponibles para Devolución
          </TabsTrigger>
          <TabsTrigger 
            value="processed" 
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-green-600"
          >
            <History className="h-4 w-4" />
            Devoluciones a Proveedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Facturas Disponibles para Devolución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por factura, proveedor, OC o bodega..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                const order = purchaseOrders.find(o => o.id === invoice.purchaseOrderId);
                
                return (
                  <Card key={invoice.id} className="p-4 border-l-4 border-l-orange-500">
                    <div className="space-y-4">
                      {/* Información de la Factura */}
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2">
                          <div className="text-sm font-medium">{invoice.supplierInvoiceNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        
                        <div className="col-span-3">
                          <div className="text-sm font-medium">{supplier?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            OC: {order?.consecutive}
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="text-sm font-medium">{invoice.warehouseCode}</div>
                          <div className="text-xs text-muted-foreground">Bodega</div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="text-sm font-medium">
                            ${invoice.total.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Total facturado</div>
                        </div>
                        
                        <div className="col-span-2">
                          <Badge variant="secondary">{invoice.status}</Badge>
                        </div>
                        
                        <div className="col-span-1">
                          <Button
                            onClick={() => handleStartReturn(invoice)}
                            size="sm"
                            className="w-full bg-orange-600 hover:bg-orange-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Procesar Devolución
                          </Button>
                        </div>
                      </div>

                      {/* Información Adicional de la Factura */}
                      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Procesado por:</span> {invoice.processedBy}<br/>
                            <span className="font-medium">Fecha factura:</span> {invoice.invoiceDate}<br/>
                            <span className="font-medium">Fecha vencimiento:</span> {invoice.dueDate}
                          </div>
                          <div>
                            <span className="font-medium">Retenciones:</span><br/>
                            • ICA: ${(invoice.retentionICA || 0).toLocaleString()}<br/>
                            • Fuente: ${(invoice.retentionFuente || 0).toLocaleString()}<br/>
                            • IVA: ${(invoice.retentionIVA || 0).toLocaleString()}<br/>
                            • CREE: ${(invoice.retentionCREE || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {filteredInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {invoices.length === 0 
                    ? "No hay facturas radicadas disponibles para devolución"
                    : "No se encontraron facturas que coincidan con la búsqueda"
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Devoluciones a Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nota crédito, factura, proveedor o procesado por..."
                    value={processedSearchTerm}
                    onChange={(e) => setProcessedSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="space-y-4">
                  {filteredProcessedReturns.map((returnItem) => (
                    <Card key={returnItem.id} className="p-4 border-l-4 border-l-green-500">
                      <div className="space-y-4">
                        {/* Información de la Devolución */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <div className="text-sm font-medium text-green-700">{returnItem.creditNoteNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(returnItem.returnDate).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="text-sm font-medium">Factura: {returnItem.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">Original</div>
                          </div>
                          
                          <div className="col-span-3">
                            <div className="text-sm font-medium">{returnItem.supplierName}</div>
                            <div className="text-xs text-muted-foreground">Proveedor</div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="text-sm font-medium">
                              ${returnItem.totalAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Monto devuelto</div>
                          </div>
                          
                          <div className="col-span-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {returnItem.status === 'processed' ? 'Procesada' : returnItem.status}
                            </Badge>
                          </div>
                          
                          <div className="col-span-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedReturnDetail(returnItem);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Ver Detalle
                            </Button>
                          </div>
                        </div>

                        {/* Información Adicional de la Devolución */}
                        <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Procesado por:</span> {returnItem.processedBy}<br/>
                              <span className="font-medium">Fecha procesamiento:</span> {returnItem.returnDate}<br/>
                              <span className="font-medium">Productos devueltos:</span> {returnItem.items.length}
                            </div>
                            <div>
                              <span className="font-medium">Productos:</span><br/>
                              {returnItem.items.map((item, index) => (
                                <div key={index}>
                                  • {item.productName} ({item.productCode}): {item.quantity} x ${item.unitPrice.toLocaleString()}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {filteredProcessedReturns.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {processedReturns.length === 0 
                        ? "No hay devoluciones a proveedores procesadas aún"
                        : "No se encontraron devoluciones que coincidan con la búsqueda"
                      }
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Processing Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={(open) => {
        setIsReturnDialogOpen(open);
        if (!open) resetReturnForm();
      }}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Procesar Devolución - Factura {selectedInvoice?.supplierInvoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Seleccione los productos y cantidades a devolver
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-white border rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Factura:</span> <span className="font-semibold">{selectedInvoice.supplierInvoiceNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Proveedor:</span> <span className="font-semibold">{selectedInvoice.supplierName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total Original:</span> <span className="font-semibold">${selectedInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span> <span className="font-semibold">{selectedInvoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Bodega:</span> <span className="font-semibold">{selectedInvoice.warehouseName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span> <span className="font-semibold">{selectedInvoice.status}</span>
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Productos a Devolver
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Producto</th>
                        <th colSpan={3} className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Cantidades</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Cant. a Devolver</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Precio Unit.</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">% IVA</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">% Desc.</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Total Devolución</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Facturadas</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Devueltas</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Disponible</th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-500">{item.productCode}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                            {item.invoicedQuantity}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center text-red-600 font-medium">
                            {item.returnedQuantity || 0}
                          </td>
                          <td className="border border-gray-300 px-3 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              item.availableToReturn > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.availableToReturn}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <Input
                              type="number"
                              value={item.returnQuantity || ''}
                              onChange={(e) => updateReturnItem(index, Number(e.target.value))}
                              min="0"
                              max={item.availableToReturn}
                              className="w-20 text-center"
                              placeholder={item.availableToReturn > 0 ? "0" : "N/A"}
                              disabled={item.availableToReturn === 0}
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            ${item.unitPrice?.toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {item.taxRate}%
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {item.discountRate}%
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                            ${item.returnTotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Return Totals */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Totales de Devolución
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal a devolver:</span>
                        <span className="font-mono">${calculateReturnTotals().subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Descuentos:</span>
                        <span className="font-mono text-red-600">-${calculateReturnTotals().totalDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IVA:</span>
                        <span className="font-mono">${calculateReturnTotals().totalTax.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-700">Total Nota Crédito</div>
                        <div className="text-2xl font-bold text-orange-700">
                          ${calculateReturnTotals().total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Notes */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones de la Devolución</h3>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Motivo de la devolución, observaciones generales..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleProcessReturn}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Procesar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Detalle de Nota Crédito - {selectedReturnDetail?.creditNoteNumber}
            </DialogTitle>
            <DialogDescription>
              Información completa de la devolución procesada
            </DialogDescription>
          </DialogHeader>
          
          {selectedReturnDetail && (
            <div className="space-y-6">
              {/* Información de la Sede/Bodega */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Información de Sede/Bodega
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Código de Bodega:</span> <span className="font-semibold">BOG001</span><br/>
                    <span className="font-medium text-blue-700">Nombre:</span> <span className="font-semibold">Bodega Principal Bogotá</span><br/>
                    <span className="font-medium text-blue-700">Dirección:</span> <span className="font-semibold">Calle 100 # 15-20, Bogotá</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Teléfono:</span> <span className="font-semibold">+57 (1) 234-5678</span><br/>
                    <span className="font-medium text-blue-700">Email:</span> <span className="font-semibold">bodega.bog@empresa.com</span><br/>
                    <span className="font-medium text-blue-700">Responsable:</span> <span className="font-semibold">María González</span>
                  </div>
                </div>
              </div>

              {/* Información del Proveedor */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Información del Proveedor
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">NIT:</span> <span className="font-semibold">900.123.456-7</span><br/>
                    <span className="font-medium text-purple-700">Razón Social:</span> <span className="font-semibold">{selectedReturnDetail.supplierName}</span><br/>
                    <span className="font-medium text-purple-700">Email:</span> <span className="font-semibold">ventas@proveedorejemplo.com</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Teléfono:</span> <span className="font-semibold">+57 (1) 987-6543</span><br/>
                    <span className="font-medium text-purple-700">Dirección:</span> <span className="font-semibold">Avenida Caracas # 45-67, Bogotá</span><br/>
                    <span className="font-medium text-purple-700">Contacto:</span> <span className="font-semibold">Carlos Ramírez</span>
                  </div>
                </div>
              </div>

              {/* Detalle de Productos Devueltos */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Productos Devueltos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-green-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-green-300 px-4 py-3 text-left font-medium text-green-800">Código</th>
                        <th className="border border-green-300 px-4 py-3 text-left font-medium text-green-800">Producto</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">Cantidad</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">Precio Unit.</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">% IVA</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">Subtotal</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">IVA</th>
                        <th className="border border-green-300 px-4 py-3 text-center font-medium text-green-800">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturnDetail.items.map((item, index) => {
                        const subtotal = item.quantity * item.unitPrice;
                        const iva = subtotal * 0.19; // 19% IVA
                        const total = subtotal + iva;
                        
                        return (
                          <tr key={index} className="hover:bg-green-25">
                            <td className="border border-green-300 px-4 py-3 font-medium text-green-800">{item.productCode}</td>
                            <td className="border border-green-300 px-4 py-3">{item.productName}</td>
                            <td className="border border-green-300 px-4 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="border border-green-300 px-4 py-3 text-center">${item.unitPrice.toLocaleString()}</td>
                            <td className="border border-green-300 px-4 py-3 text-center">19%</td>
                            <td className="border border-green-300 px-4 py-3 text-center">${subtotal.toLocaleString()}</td>
                            <td className="border border-green-300 px-4 py-3 text-center">${iva.toLocaleString()}</td>
                            <td className="border border-green-300 px-4 py-3 text-center font-bold">${total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de Totales */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Resumen de Totales
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-orange-700">Subtotal:</span>
                      <span className="font-mono font-semibold">${(selectedReturnDetail.totalAmount / 1.19).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-orange-700">IVA (19%):</span>
                      <span className="font-mono font-semibold">${(selectedReturnDetail.totalAmount * 0.19 / 1.19).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-orange-700">Descuentos:</span>
                      <span className="font-mono font-semibold text-red-600">-$0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center p-4 bg-orange-100 rounded-lg">
                      <div className="text-lg font-bold text-orange-800">Total Nota Crédito</div>
                      <div className="text-3xl font-bold text-orange-800">
                        ${selectedReturnDetail.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Información Adicional
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nota Crédito:</span> <span className="font-semibold">{selectedReturnDetail.creditNoteNumber}</span><br/>
                    <span className="font-medium text-gray-700">Factura Original:</span> <span className="font-semibold">{selectedReturnDetail.invoiceNumber}</span><br/>
                    <span className="font-medium text-gray-700">Fecha Procesamiento:</span> <span className="font-semibold">{new Date(selectedReturnDetail.returnDate).toLocaleDateString('es-ES')}</span><br/>
                    <span className="font-medium text-gray-700">Procesado por:</span> <span className="font-semibold">{selectedReturnDetail.processedBy}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span> <span className="font-semibold text-green-600">✅ Procesada</span><br/>
                    <span className="font-medium text-gray-700">Motivo:</span> <span className="font-semibold">Mercancía defectuosa</span><br/>
                    <span className="font-medium text-gray-700">Productos devueltos:</span> <span className="font-semibold">{selectedReturnDetail.items.length}</span><br/>
                    <span className="font-medium text-gray-700">Observaciones:</span> <span className="font-semibold">Productos presentaron defectos de calidad</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailDialogOpen(false)}
              className="mr-2"
            >
              Cerrar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Returns;