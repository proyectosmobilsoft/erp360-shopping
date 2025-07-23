import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PurchaseOrder, WarehouseEntry, WarehouseEntryItem, KardexEntry } from '@/types';
import { Package, Search, CheckCircle, AlertCircle, Building2, Calendar, FileText, User, Clock, Archive, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import DocumentAttachments from '@/components/DocumentAttachments';
import { formatNit } from '@/utils/colombianCities';

export default function WarehouseEntries() {
  const { purchaseOrders, suppliers, warehouseEntries, addWarehouseEntry, addKardexEntry } = usePurchasing();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [entryItems, setEntryItems] = useState<Partial<WarehouseEntryItem>[]>([]);
  const [entryNotes, setEntryNotes] = useState('');
  const [receiveAllChecked, setReceiveAllChecked] = useState(false);
  
  // Simular usuario logueado - en producción esto vendría del contexto de autenticación
  const currentUser = {
    name: 'Juan Carlos Pérez',
    email: 'jperez@empresa.com',
    role: 'Coordinador de Almacén'
  };
  
  const [receivedBy, setReceivedBy] = useState(currentUser.name);

  const warehouses = [
    { code: 'BOG001', name: 'Bodega Principal Bogotá' },
    { code: 'MED002', name: 'Sede Medellín' },
    { code: 'CLO003', name: 'Centro de Distribución Cali' }
  ];

  // Filter orders that have pending items to receive
  const pendingOrders = purchaseOrders.filter(order => {
    // Allow DRAFT, APPROVED, and SENT orders to be received
    if (!['DRAFT', 'APPROVED', 'SENT'].includes(order.status)) return false;
    
    const hasPendingItems = order.items.some(item => {
      const receivedQuantity = item.receivedQuantity || 0;
      const orderedQuantity = item.quantity || 0;
      return receivedQuantity < orderedQuantity;
    });
    
    console.log('Order:', order.consecutive, 'Status:', order.status, 'Has Pending Items:', hasPendingItems);
    
    return hasPendingItems;
  });

  const filteredOrders = pendingOrders.filter(order => {
    const orderNumber = order.consecutive || order.orderNumber || order.id;
    const supplierName = order.supplierName || '';
    const warehouseName = order.warehouseName || '';
    
    return orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           warehouseName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleStartEntry = (order: PurchaseOrder) => {
    console.log('Opening entry for order:', order.consecutive, 'Items:', order.items);
    
    setSelectedOrder(order);
    // Inicializar items con las cantidades actuales de la orden (incluyendo las ya recibidas)
    const initialItems = order.items.map(item => {
      const alreadyReceived = item.receivedQuantity || 0;
      const remainingToReceive = Math.max(0, item.quantity - alreadyReceived);
      
      console.log(`Item ${item.productName}: Ordered=${item.quantity}, Already Received=${alreadyReceived}, Remaining=${remainingToReceive}`);
      
      return {
        id: '',
        productCode: item.productId,
        productName: item.productName,
        unit: item.unit,
        orderedQuantity: item.quantity,
        receivedQuantity: 0, // Nueva cantidad a recibir en esta entrada
        alreadyReceivedQuantity: alreadyReceived, // Cantidad ya recibida previamente
        unitPrice: item.unitPrice,
        condition: 'good' as const,
        notes: ''
      };
    });
    
    setEntryItems(initialItems);
    setEntryNotes('');
    setReceiveAllChecked(false);
    setReceivedBy(currentUser.name); // Establecer usuario logueado por defecto
    setIsDialogOpen(true);
  };

  const updateEntryItem = (index: number, field: keyof WarehouseEntryItem, value: string | number) => {
    setEntryItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleReceiveAllToggle = (checked: boolean) => {
    setReceiveAllChecked(checked);
    if (checked) {
      // Marcar todas las cantidades pendientes como recibidas
      setEntryItems(prev => prev.map(item => {
        const alreadyReceived = item.alreadyReceivedQuantity || 0;
        const pendingQuantity = Math.max(0, (item.orderedQuantity || 0) - alreadyReceived);
        return {
          ...item,
          receivedQuantity: pendingQuantity
        };
      }));
    } else {
      // Limpiar cantidades recibidas
      setEntryItems(prev => prev.map(item => ({
        ...item,
        receivedQuantity: 0
      })));
    }
  };

  const generateEntryNumber = (warehouseCode: string) => {
    const existingEntries = warehouseEntries.filter(entry => entry.warehouseCode === warehouseCode);
    const nextNumber = existingEntries.length + 1;
    return `ENT-${warehouseCode}-${String(nextNumber).padStart(4, '0')}`;
  };

  const handleSaveEntry = async () => {
    if (!selectedOrder || !receivedBy.trim()) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const itemsToReceive = entryItems.filter(item => (item.receivedQuantity || 0) > 0);
    
    if (itemsToReceive.length === 0) {
      toast({
        title: "Error",
        description: "Debe recibir al menos un producto",
        variant: "destructive"
      });
      return;
    }

    try {
      const warehouseCode = selectedOrder.warehouseCode || 'BOG001';
      const entryNumber = generateEntryNumber(warehouseCode);

      // Create warehouse entry
      const newEntry: WarehouseEntry = {
        id: Date.now().toString(),
        entryNumber,
        purchaseOrderId: selectedOrder.id,
        warehouseCode,
        warehouseName: selectedOrder.warehouseName || 'Bodega Principal',
        entryDate: new Date().toISOString(),
        receivedBy: receivedBy.trim(),
        items: itemsToReceive as WarehouseEntryItem[],
        notes: entryNotes.trim(),
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addWarehouseEntry(newEntry);

      // Create kardex entries for each received item
      for (const item of itemsToReceive) {
        const kardexEntry: KardexEntry = {
          id: `${Date.now()}-${item.productCode}`,
          date: new Date().toISOString(),
          productCode: item.productCode!,
          productName: item.productName!,
          movementType: 'ENTRY',
          quantity: item.receivedQuantity!,
          unitPrice: item.unitPrice!,
          totalValue: (item.receivedQuantity! * item.unitPrice!),
          warehouseCode,
          warehouseName: selectedOrder.warehouseName || 'Bodega Principal',
          reference: `Entrada ${entryNumber}`,
          notes: `Recepción de OC ${selectedOrder.consecutive}`,
          balance: item.receivedQuantity! // This would be calculated based on existing inventory
        };

        await addKardexEntry(kardexEntry);
      }

      toast({
        title: "Entrada registrada",
        description: `Entrada ${entryNumber} creada exitosamente`,
      });

      setIsDialogOpen(false);
      resetForm();

    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al registrar la entrada",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setEntryItems([]);
    setEntryNotes('');
    setReceiveAllChecked(false);
    setReceivedBy(currentUser.name); // Mantener usuario logueado por defecto
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Aprobada';
      case 'SENT': return 'Enviada';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entradas de Almacén</h1>
          <p className="text-muted-foreground">
            Gestiona la recepción de mercancías de órdenes de compra
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-2">
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-blue-600"
          >
            <Package className="h-4 w-4" />
            Órdenes Pendientes por Recibir
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:bg-gray-200 data-[state=active]:hover:bg-green-600"
          >
            <History className="h-4 w-4" />
            Historial de Entradas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Órdenes Pendientes por Recibir</span>
          </CardTitle>
          <CardDescription>
            Órdenes de compra aprobadas esperando recepción de mercancía
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por consecutivo, proveedor o bodega..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consecutivo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Fecha Expedición</TableHead>
                <TableHead>Items Recibidos</TableHead>
                <TableHead>Items Pendientes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const receivedItems = order.items.filter(item => (item.receivedQuantity || 0) > 0).length;
                const pendingItems = order.items.filter(item => {
                  const received = item.receivedQuantity || 0;
                  const ordered = item.quantity || 0;
                  return received < ordered;
                }).length;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{order.consecutive}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.supplierName}</p>
                        <p className="text-sm text-gray-500">{formatNit(order.supplierNit || '')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span>{order.warehouseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{new Date(order.expeditionDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-700">{receivedItems}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-orange-700">{pendingItems}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleStartEntry(order)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Recibir Mercancía
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No se encontraron órdenes pendientes' : 'No hay órdenes pendientes por recibir'}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="w-5 h-5" />
            <span>Historial de Entradas</span>
          </CardTitle>
          <CardDescription>
            Registro completo de todas las entradas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Entrada</TableHead>
                <TableHead>Orden de Compra</TableHead>
                <TableHead>Fecha Entrada</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Recibido por</TableHead>
                <TableHead className="text-right">Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseEntries.map((entry) => {
                const order = purchaseOrders.find(po => po.id === entry.purchaseOrderId);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{entry.entryNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{order?.consecutive || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{new Date(entry.entryDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{entry.warehouseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order?.supplierName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order?.supplierNit}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{entry.items.length} productos</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={entry.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                       entry.status === 'partial' ? 'bg-orange-100 text-orange-800' : 
                                       'bg-gray-100 text-gray-800'}>
                        {entry.status === 'completed' ? 'Completa' : 
                         entry.status === 'partial' ? 'Parcial' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{entry.receivedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {Math.floor((new Date().getTime() - new Date(entry.entryDate).getTime()) / (1000 * 60 * 60 * 24))} días
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {warehouseEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay entradas registradas aún
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Entrada de Mercancía - {selectedOrder?.consecutive}
            </DialogTitle>
            <DialogDescription>
              Registra la mercancía recibida para la orden de compra
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-white border rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Consecutivo:</span> <span className="font-semibold">{selectedOrder.consecutive}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Bodega:</span> <span className="font-semibold">{selectedOrder.warehouseName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span> <span className="font-semibold">{new Date(selectedOrder.expeditionDate).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Proveedor:</span> <span className="font-semibold">{selectedOrder.supplierName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">NIT:</span> <span className="font-semibold">{selectedOrder.supplierNit}</span>
                  </div>
                </div>
              </div>

              {/* Entry Data */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Entrada</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="receivedBy" className="font-medium text-gray-700">Recibido por *</Label>
                    <Input
                      id="receivedBy"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      placeholder="Nombre de quien recibe"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryDate" className="font-medium text-gray-700">Fecha de Recepción</Label>
                    <Input
                      id="entryDate"
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      disabled
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Products to Receive */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Productos a Recibir</h3>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="selectAll" 
                      className="w-4 h-4" 
                      checked={receiveAllChecked}
                      onChange={(e) => handleReceiveAllToggle(e.target.checked)}
                    />
                    <label htmlFor="selectAll" className="text-sm text-gray-700">Colocar un check para dar por recibido toda la orden</label>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Producto</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Unidad</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Registro de Cantidades</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">% IVA</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Precio Unit.</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700">Estado</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">
                          <div className="grid grid-cols-3 gap-1">
                            <span>Ordenadas</span>
                            <span>Recibidas</span>
                            <span>Por entregar</span>
                          </div>
                        </th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                        <th className="border border-gray-300 px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryItems.map((item, index) => {
                        const alreadyReceived = item.alreadyReceivedQuantity || 0;
                        const totalReceived = alreadyReceived + (item.receivedQuantity || 0);
                        const pendingQuantity = Math.max(0, (item.orderedQuantity || 0) - totalReceived);
                        const maxNewReceive = Math.max(0, (item.orderedQuantity || 0) - alreadyReceived);
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.unit}</td>
                            <td className="border border-gray-300 px-3 py-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center font-medium">{item.orderedQuantity}</div>
                                <div className="text-center">
                                  <Input
                                    type="number"
                                    value={item.receivedQuantity || ''}
                                    onChange={(e) => updateEntryItem(index, 'receivedQuantity', Number(e.target.value))}
                                    min="0"
                                    max={maxNewReceive}
                                    className="w-16 text-center border-0 bg-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder={maxNewReceive.toString()}
                                  />
                                </div>
                                <div className="text-center">
                                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    pendingQuantity > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {pendingQuantity}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">19%</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">${item.unitPrice?.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-3">
                              <Select
                                value={item.condition || 'good'}
                                onValueChange={(value) => updateEntryItem(index, 'condition', value)}
                              >
                                <SelectTrigger className="border-0 bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="good">Bueno</SelectItem>
                                  <SelectItem value="damaged">Dañado</SelectItem>
                                  <SelectItem value="defective">Defectuoso</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones Generales</h3>
                <Textarea
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="Observaciones generales sobre la recepción de mercancía..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Documentos Adjuntos */}
              <DocumentAttachments
                documentId={selectedOrder?.id || 'new'}
                documentType="warehouse_entry"
                attachments={[]}
                onAttachmentsChange={(attachments) => {
                  console.log('Warehouse entry attachments updated:', attachments);
                }}
              />
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEntry}>
              Registrar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}