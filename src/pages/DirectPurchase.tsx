import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, FileText, Calendar, Building2 } from 'lucide-react';
import DirectPurchaseDialog from '@/components/DirectPurchaseDialog';
import { useToast } from '@/hooks/use-toast';

export default function DirectPurchase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Sample data for direct purchases
  const [directPurchases, setDirectPurchases] = useState([
    {
      id: '1',
      consecutive: 'CD-001',
      supplierName: 'Distribuidora ABC S.A.S',
      supplierNit: '900123456-7',
      warehouseName: 'Bodega Principal',
      date: '2024-01-15',
      status: 'completed',
      total: 2450000,
      itemsCount: 5,
      invoiceNumber: 'FV-2024-001'
    },
    {
      id: '2',
      consecutive: 'CD-002',
      supplierName: 'Comercializadora XYZ Ltda',
      supplierNit: '800987654-3',
      warehouseName: 'Bodega Secundaria',
      date: '2024-01-16',
      status: 'pending',
      total: 1850000,
      itemsCount: 3,
      invoiceNumber: null
    }
  ]);

  const filteredPurchases = directPurchases.filter(purchase => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      purchase.consecutive.toLowerCase().includes(searchTerm) ||
      purchase.supplierName.toLowerCase().includes(searchTerm) ||
      purchase.supplierNit.includes(searchTerm)
    );
  });

  const handleNewDirectPurchase = () => {
    setIsDialogOpen(true);
  };

  const handleSaveDirectPurchase = () => {
    // Generate new consecutive
    const newConsecutive = `CD-${String(directPurchases.length + 1).padStart(3, '0')}`;
    
    // Add new direct purchase
    const newPurchase = {
      id: String(directPurchases.length + 1),
      consecutive: newConsecutive,
      supplierName: 'Nuevo Proveedor S.A.S',
      supplierNit: '900555666-1',
      warehouseName: 'Bodega Principal',
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
      total: 3200000,
      itemsCount: 4,
      invoiceNumber: `FV-2024-${String(directPurchases.length + 1).padStart(3, '0')}`
    };

    setDirectPurchases(prev => [...prev, newPurchase]);
    setIsDialogOpen(false);

    toast({
      title: "Compra Directa Completada",
      description: `Se ha procesado exitosamente la compra ${newConsecutive} con 3 procesos integrados.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compra Directa - 3 en 1</h1>
          <p className="text-muted-foreground">
            Gestiona órdenes de compra, entrada de almacén y radicación de facturas en un solo proceso
          </p>
        </div>
        <Button 
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={handleNewDirectPurchase}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Compra Directa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Historial de Compras Directas</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por consecutivo, proveedor o NIT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No se encontraron compras directas' : 'No hay compras directas registradas'}
              </div>
            ) : (
              filteredPurchases.map((purchase) => (
                <Card key={purchase.id} className="p-4 border-l-4 border-l-cyan-500">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-cyan-500" />
                        <div>
                          <div className="text-sm font-medium text-cyan-700">{purchase.consecutive}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(purchase.date).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="text-sm font-medium">{purchase.supplierName}</div>
                      <div className="text-xs text-muted-foreground">{purchase.supplierNit}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{purchase.warehouseName}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-sm">
                        <span className="font-medium text-cyan-600">{purchase.itemsCount}</span>
                        <div className="text-xs text-muted-foreground">productos</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="text-sm font-medium">
                        ${purchase.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Total facturado</div>
                    </div>
                    
                    <div className="col-span-1">
                      {getStatusBadge(purchase.status)}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-3 pt-3 border-t bg-cyan-50 -mx-4 -mb-4 px-4 py-3 rounded-b">
                    <div className="grid grid-cols-3 gap-4 text-xs text-cyan-800">
                      <div>
                        <span className="font-medium">Procesos completados:</span>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                            Orden de Compra
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                            Entrada Almacén
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                            Factura Radicada
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">N° Factura:</span> {purchase.invoiceNumber || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Tiempo de procesamiento:</span> 3 min aprox.
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <DirectPurchaseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveDirectPurchase}
      />
    </div>
  );
}