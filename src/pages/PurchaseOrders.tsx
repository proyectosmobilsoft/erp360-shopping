import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePurchasing } from '@/contexts/PurchasingContext';
import { PurchaseOrder, Supplier, PurchaseOrderItem, PurchaseOrderDocument } from '@/types';
import { Plus, Search, Edit, Trash2, ShoppingCart, FileText, Building2, Calendar, Eye, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNit } from '@/utils/colombianCities';
import DocumentUploader from '@/components/DocumentUploader';
import PurchaseOrderReport from '@/components/PurchaseOrderReport';
import DocumentAttachments from '@/components/DocumentAttachments';

export default function PurchaseOrders() {
  const { purchaseOrders, suppliers, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = usePurchasing();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<Partial<PurchaseOrderItem>[]>([]);
  const [orderDocuments, setOrderDocuments] = useState<PurchaseOrderDocument[]>([]);
  
  const warehouses = [
    { code: 'BOG001', name: 'Bodega Principal Bogotá' },
    { code: 'MED002', name: 'Sede Medellín' },
    { code: 'CAL003', name: 'Sucursal Cali' },
    { code: 'BAQ004', name: 'Centro Barranquilla' }
  ];

  const sampleProducts = [
    { id: '1', name: 'Papel Bond A4 75g', unit: 'RESMA', price: 12500 },
    { id: '2', name: 'Bolígrafo BIC Azul', unit: 'UND', price: 800 },
    { id: '3', name: 'Carpeta Oficio Manila', unit: 'UND', price: 2300 },
    { id: '4', name: 'Toner HP 85A Original', unit: 'UND', price: 185000 },
    { id: '5', name: 'Cable UTP Cat 6', unit: 'MTS', price: 2100 }
  ];

  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    warehouseCode: '',
    warehouseName: '',
    expeditionDate: new Date().toISOString().split('T')[0],
    consecutive: '',
    supplierId: '',
    supplierName: '',
    supplierNit: '',
    supplierAddress: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierTaxRegime: '',
    items: [],
    documents: [],
    subtotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    total: 0,
    status: 'DRAFT',
    notes: ''
  });

  const filteredOrders = purchaseOrders.filter(order =>
    order.consecutive.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.warehouseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate consecutive number based on warehouse
  const generateConsecutive = (warehouseCode: string) => {
    const existingOrders = purchaseOrders.filter(order => order.warehouseCode === warehouseCode);
    const nextNumber = existingOrders.length + 1;
    return `${warehouseCode}-${String(nextNumber).padStart(4, '0')}`;
  };

  // Handle warehouse selection
  const handleWarehouseChange = (warehouseCode: string) => {
    const warehouse = warehouses.find(w => w.code === warehouseCode);
    if (warehouse) {
      const consecutive = generateConsecutive(warehouseCode);
      setFormData(prev => ({
        ...prev,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        consecutive
      }));
    }
  };

  // Handle supplier selection
  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormData(prev => ({
        ...prev,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierNit: supplier.documentType === 'NIT' 
          ? formatNit(supplier.documentNumber, supplier.verificationDigit)
          : `${supplier.documentType} ${supplier.documentNumber}`,
        supplierAddress: supplier.address,
        supplierEmail: supplier.email,
        supplierPhone: supplier.phone,
        supplierTaxRegime: supplier.taxContributorType
      }));
    }
  };

  // Add new item row
  const addOrderItem = () => {
    setOrderItems(prev => [...prev, {
      productId: '',
      productName: '',
      unit: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
      discountRate: 0,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0
    }]);
  };

  // Update item
  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      if (field === 'productName') {
        const product = sampleProducts.find(p => p.name === value);
        if (product) {
          item.productId = product.id;
          item.productName = product.name;
          item.unit = product.unit;
          item.unitPrice = product.price;
        }
      } else {
        (item as Record<string, string | number>)[field] = value;
      }

      // Recalculate totals
      if (['quantity', 'unitPrice', 'taxRate', 'discountRate'].includes(field)) {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const taxRate = Number(item.taxRate) || 0;
        const discountRate = Number(item.discountRate) || 0;

        item.subtotal = quantity * unitPrice;
        item.discountAmount = item.subtotal * (discountRate / 100);
        const afterDiscount = item.subtotal - item.discountAmount;
        item.taxAmount = afterDiscount * (taxRate / 100);
        item.total = afterDiscount + item.taxAmount;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Remove item
  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate order totals
  useEffect(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalDiscount = orderItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalTax = orderItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const total = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalDiscount,
      totalTax,
      total,
      items: orderItems as PurchaseOrderItem[],
      documents: orderDocuments
    }));
  }, [orderItems, orderDocuments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.warehouseCode || !formData.supplierId || orderItems.length === 0) {
      toast({
        title: "Campos obligatorios",
        description: "Bodega, proveedor y al menos un producto son requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingOrder) {
        updatePurchaseOrder(editingOrder.id, formData);
        toast({
          title: "Orden actualizada",
          description: "La orden de compra se actualizó correctamente.",
        });
      } else {
        addPurchaseOrder(formData as Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>);
        toast({
          title: "Orden creada",
          description: "La orden de compra se creó exitosamente.",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar la orden",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setSelectedSupplier(null);
    setOrderItems([]);
    setOrderDocuments([]);
    setFormData({
      warehouseCode: '',
      warehouseName: '',
      expeditionDate: new Date().toISOString().split('T')[0],
      consecutive: '',
      supplierId: '',
      supplierName: '',
      supplierNit: '',
      supplierAddress: '',
      supplierEmail: '',
      supplierPhone: '',
      supplierTaxRegime: '',
      items: [],
      documents: [],
      subtotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      total: 0,
      status: 'DRAFT',
      notes: ''
    });
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData(order);
    setOrderItems(order.items);
    setOrderDocuments(order.documents || []);
    const supplier = suppliers.find(s => s.id === order.supplierId);
    setSelectedSupplier(supplier || null);
    setIsDialogOpen(true);
  };

  const handleViewReport = (order: PurchaseOrder) => {
    setViewingOrder(order);
    setIsReportDialogOpen(true);
  };

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailOrder, setEmailOrder] = useState<PurchaseOrder | null>(null);
  const [emailRecipients, setEmailRecipients] = useState({
    supplier: true,
    purchaseManager: true,
    customEmails: ''
  });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const handleSendEmail = (order: PurchaseOrder) => {
    setEmailOrder(order);
    setEmailSubject(`Orden de Compra ${order.consecutive} - ${order.supplierName}`);
    setEmailMessage(`Estimados,

Adjunto encontrarán la Orden de Compra ${order.consecutive} por un valor de $${order.total.toLocaleString()}.

Favor confirmar recepción y fecha estimada de entrega.

Saludos cordiales,
Departamento de Compras`);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmailConfirm = () => {
    if (!emailOrder) return;

    const recipients = [];
    if (emailRecipients.supplier) recipients.push(emailOrder.supplierEmail);
    if (emailRecipients.purchaseManager) recipients.push('compras@empresa.com');
    if (emailRecipients.customEmails) {
      recipients.push(...emailRecipients.customEmails.split(',').map(email => email.trim()));
    }

    // Simular envío de email
    toast({
      title: "✅ Email enviado exitosamente",
      description: `La orden ${emailOrder.consecutive} fue enviada a ${recipients.length} destinatario(s)`,
    });

    setIsEmailDialogOpen(false);
    setEmailOrder(null);
    setEmailRecipients({ supplier: true, purchaseManager: true, customEmails: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta orden de compra?')) {
      deletePurchaseOrder(id);
      toast({
        title: "Orden eliminada",
        description: "La orden de compra ha sido eliminada correctamente",
      });
    }
  };

  // Function to check if an order has received items (partial or total)
  const hasReceivedItems = (order: PurchaseOrder): boolean => {
    return order.items.some(item => (item.receivedQuantity || 0) > 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
          <p className="text-gray-600">Gestiona las órdenes de compra a proveedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
              </DialogTitle>
              <DialogDescription>
                {editingOrder 
                  ? 'Modifica los datos de la orden de compra' 
                  : 'Completa la información de la nueva orden de compra'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                {/* Header Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Información de la Orden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse" className="text-sm font-medium">Bodega/Sede *</Label>
                        <Select
                          value={formData.warehouseCode}
                          onValueChange={handleWarehouseChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar bodega" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.code} value={warehouse.code}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expeditionDate" className="text-sm font-medium">Fecha de Expedición *</Label>
                        <Input
                          id="expeditionDate"
                          type="date"
                          value={formData.expeditionDate}
                          onChange={(e) => setFormData({ ...formData, expeditionDate: e.target.value })}
                          className="h-9"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consecutive" className="text-sm font-medium">Consecutivo</Label>
                        <Input
                          id="consecutive"
                          value={formData.consecutive}
                          disabled
                          className="h-9 bg-gray-50"
                          placeholder="Auto-generado"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Información del Proveedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-sm font-medium">Proveedor *</Label>
                        <Select
                          value={formData.supplierId}
                          onValueChange={handleSupplierChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.filter(s => s.status).map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name} - {supplier.documentType === 'NIT' 
                                  ? formatNit(supplier.documentNumber, supplier.verificationDigit)
                                  : `${supplier.documentType} ${supplier.documentNumber}`
                                }
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedSupplier && (
                        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg text-xs">
                          <div>
                            <span className="font-medium text-gray-600">NIT:</span> {formData.supplierNit}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Régimen:</span> {formData.supplierTaxRegime}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Tel:</span> {formData.supplierPhone}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">Dir:</span> {formData.supplierAddress}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Email:</span> {formData.supplierEmail}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Items Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Productos
                      </CardTitle>
                      <Button type="button" onClick={addOrderItem} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Producto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Producto</TableHead>
                            <TableHead className="w-[80px]">Unidad</TableHead>
                            <TableHead className="w-[80px]">Cantidad</TableHead>
                            <TableHead className="w-[100px]">Precio Unit.</TableHead>
                            <TableHead className="w-[80px]">Tasa IVA</TableHead>
                            <TableHead className="w-[80px]">% Desc.</TableHead>
                            <TableHead className="w-[100px]">Subtotal</TableHead>
                            <TableHead className="w-[100px]">Total</TableHead>
                            <TableHead className="w-[50px]">Acc.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={item.productName}
                                  onValueChange={(value) => updateOrderItem(index, 'productName', value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Buscar producto..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sampleProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.name}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.unit}
                                  disabled
                                  className="h-8 bg-gray-50 text-center text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                                  className="h-8"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                                  className="h-8"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.taxRate}
                                  onChange={(e) => updateOrderItem(index, 'taxRate', e.target.value)}
                                  className="h-8"
                                  min="0"
                                  max="100"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.discountRate}
                                  onChange={(e) => updateOrderItem(index, 'discountRate', e.target.value)}
                                  className="h-8"
                                  min="0"
                                  max="100"
                                />
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono">
                                  ${(item.subtotal || 0).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono font-medium">
                                  ${(item.total || 0).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOrderItem(index)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Totals */}
                    {orderItems.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <div className="w-80 space-y-2 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span className="font-mono">${formData.subtotal?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Descuentos:</span>
                            <span className="font-mono text-red-600">-${formData.totalDiscount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>IVA:</span>
                            <span className="font-mono">${formData.totalTax?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-semibold border-t pt-2">
                            <span>Total:</span>
                            <span className="font-mono">${formData.total?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DocumentAttachments
                    documentId={editingOrder?.id || 'new'}
                    documentType="purchase_order"
                    attachments={[]}
                    onAttachmentsChange={(attachments) => {
                      // Aquí se manejarían los documentos adjuntos
                      console.log('Attachments updated:', attachments);
                    }}
                  />
                </div>

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Agregar observaciones o notas especiales para esta orden..."
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingOrder ? 'Actualizar' : 'Crear'} Orden
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por consecutivo, proveedor o bodega..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Total: {filteredOrders.length} órdenes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Órdenes de Compra</CardTitle>
          <CardDescription>
            Gestiona todas las órdenes de compra realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consecutivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{order.consecutive}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{new Date(order.expeditionDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{order.warehouseName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{order.supplierName}</p>
                      <p className="text-xs text-gray-500">{order.supplierNit}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{order.items.length} productos</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium">${order.total.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {order.status === 'DRAFT' ? 'Borrador' : 
                       order.status === 'APPROVED' ? 'Aprobada' : 
                       order.status === 'SENT' ? 'Enviada' : 'Recibida'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReport(order)}
                        title="Ver reporte"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendEmail(order)}
                        title="Enviar por correo"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(order)}
                        disabled={hasReceivedItems(order)}
                        title={hasReceivedItems(order) ? 'No se puede editar una orden que ya tiene mercancía recibida' : 'Editar orden de compra'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                        disabled={hasReceivedItems(order)}
                        className="text-red-600 hover:text-red-700"
                        title={hasReceivedItems(order) ? 'No se puede eliminar una orden que ya tiene mercancía recibida' : 'Eliminar orden de compra'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No se encontraron órdenes' : 'No hay órdenes de compra registradas'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reporte de Orden de Compra</DialogTitle>
            <DialogDescription>
              Vista previa del reporte para impresión y envío
            </DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <PurchaseOrderReport
              order={viewingOrder}
              supplier={suppliers.find(s => s.id === viewingOrder.supplierId)!}
              onSendEmail={handleSendEmail}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar Orden por Correo
            </DialogTitle>
            <DialogDescription>
              Envía la orden de compra {emailOrder?.consecutive} por correo electrónico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Destinatarios */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Destinatarios:</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="supplier-email"
                    checked={emailRecipients.supplier}
                    onChange={(e) => setEmailRecipients(prev => ({ ...prev, supplier: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="supplier-email" className="text-sm">
                    Proveedor: <span className="font-medium">{emailOrder?.supplierEmail}</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="manager-email"
                    checked={emailRecipients.purchaseManager}
                    onChange={(e) => setEmailRecipients(prev => ({ ...prev, purchaseManager: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="manager-email" className="text-sm">
                    Jefe de Compras: <span className="font-medium">compras@empresa.com</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-emails" className="text-sm">Correos adicionales (separados por coma):</Label>
                <Input
                  id="custom-emails"
                  placeholder="correo1@empresa.com, correo2@empresa.com"
                  value={emailRecipients.customEmails}
                  onChange={(e) => setEmailRecipients(prev => ({ ...prev, customEmails: e.target.value }))}
                />
              </div>
            </div>

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="email-subject" className="text-sm font-medium">Asunto:</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <Label htmlFor="email-message" className="text-sm font-medium">Mensaje:</Label>
              <Textarea
                id="email-message"
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Escribe el mensaje del correo..."
              />
            </div>

            {/* Información de la orden */}
            {emailOrder && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Resumen de la Orden:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Consecutivo:</span> {emailOrder.consecutive}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> ${emailOrder.total.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Productos:</span> {emailOrder.items.length}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {new Date(emailOrder.expeditionDate).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmailConfirm}
              disabled={!emailRecipients.supplier && !emailRecipients.purchaseManager && !emailRecipients.customEmails}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar Correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}