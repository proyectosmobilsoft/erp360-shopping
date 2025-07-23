import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileText,
  Settings,
  Calendar,
  Users,
  Building2
} from 'lucide-react';
import { AccountingEngine } from './AccountingEngine';
import { PurchaseAccountingConfig, AccountingSeat, AccountingValidation } from '@/types/accounting';
import { Invoice } from '@/types';
import { usePurchasing } from '@/contexts/PurchasingContext';
import { useToast } from '@/hooks/use-toast';

export default function AccountingModule() {
  const { invoices } = usePurchasing();
  const { toast } = useToast();
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedSeat, setGeneratedSeat] = useState<AccountingSeat | null>(null);
  const [validation, setValidation] = useState<AccountingValidation | null>(null);
  const [purchaseType, setPurchaseType] = useState<'INVENTORY' | 'FIXED_ASSET'>('INVENTORY');

  // Configuración contable por defecto
  const defaultConfig: PurchaseAccountingConfig = {
    inventoryAccount: '143501',
    vatAccount: '240810',
    retentionFuenteAccount: '236540',
    retentionIvaAccount: '236505',
    retentionIcaAccount: '236805',
    suppliersAccount: '220501',
    cashAccount: '111001',
    fixedAssetsAccount: '152001'
  };

  const accountingEngine = useMemo(() => new AccountingEngine(defaultConfig), []);

  // Filtrar facturas que aún no han sido contabilizadas
  const pendingInvoices = invoices.filter(invoice => !invoice.isAccounted);

  const handleGenerateEntry = () => {
    console.log('Generando asiento para la factura:', selectedInvoiceId);
    const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!selectedInvoice) {
      toast({
        title: "Error",
        description: "Debe seleccionar una factura",
        variant: "destructive"
      });
      return;
    }

    console.log('Factura seleccionada:', selectedInvoice);
    console.log('Tipo de compra:', purchaseType);

    // Validar prerrequisitos
    const validationResult = accountingEngine.validatePrerequisites(selectedInvoice);
    setValidation(validationResult);
    console.log('Resultado de validación:', validationResult);

    if (validationResult.isValid) {
      // Generar asiento contable según el tipo de compra
      let seat: AccountingSeat;
      try {
        if (purchaseType === 'INVENTORY') {
          seat = accountingEngine.generateInventoryPurchaseEntry(selectedInvoice);
        } else {
          seat = accountingEngine.generateFixedAssetPurchaseEntry(selectedInvoice);
        }
        console.log('Asiento generado:', seat);

        setGeneratedSeat(seat);
        setIsDialogOpen(true);
      } catch (error) {
        console.error('Error al generar el asiento:', error);
        toast({
          title: "Error",
          description: "Error al generar el asiento contable: " + (error as Error).message,
          variant: "destructive"
        });
      }
    } else {
      console.log('Errores de validación encontrados:', validationResult.errors);
      toast({
        title: "Errores de validación",
        description: `Se encontraron ${validationResult.errors.length} errores que impiden la contabilización`,
        variant: "destructive"
      });
    }
  };

  const handlePostEntry = () => {
    if (!generatedSeat) return;

    // Aquí se grabaría el asiento en la base de datos
    toast({
      title: "Asiento contabilizado",
      description: `El asiento ${generatedSeat.seatNumber} ha sido grabado exitosamente`,
      variant: "default"
    });

    // Marcar la factura como contabilizada
    const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
    if (selectedInvoice) {
      selectedInvoice.isAccounted = true;
    }

    setIsDialogOpen(false);
    setGeneratedSeat(null);
    setSelectedInvoiceId('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Módulo de Contabilización</h2>
          <p className="text-gray-600">Genere asientos contables automáticos para facturas de compras</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <BookOpen className="h-4 w-4 mr-2" />
          DIAN 2025
        </Badge>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generar Asientos</TabsTrigger>
          <TabsTrigger value="validation">Validaciones</TabsTrigger>
          <TabsTrigger value="accounts">Plan de Cuentas</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Generar Asiento Contable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice-select">Seleccionar Factura</Label>
                  <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una factura..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingInvoices.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.supplierInvoiceNumber} - {invoice.supplierName} - {formatCurrency(invoice.total || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purchase-type">Tipo de Compra</Label>
                  <Select value={purchaseType} onValueChange={(value: 'INVENTORY' | 'FIXED_ASSET') => setPurchaseType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVENTORY">Inventarios/Mercancías</SelectItem>
                      <SelectItem value="FIXED_ASSET">Activos Fijos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerateEntry}
                    disabled={!selectedInvoiceId}
                    className="w-full"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Generar Asiento
                  </Button>
                </div>
              </div>

              {pendingInvoices.length === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    No hay facturas pendientes por contabilizar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lista de facturas pendientes */}
          <Card>
            <CardHeader>
              <CardTitle>Facturas Pendientes por Contabilizar ({pendingInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Retenciones</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.supplierInvoiceNumber}</TableCell>
                      <TableCell>{invoice.supplierName}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('es-CO')}</TableCell>
                      <TableCell>{formatCurrency(invoice.subtotal || 0)}</TableCell>
                      <TableCell>
                        {formatCurrency((invoice.retentionFuente || 0) + (invoice.retentionIVA || 0) + (invoice.retentionICA || 0))}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-yellow-600">
                          Pendiente
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Sistema de Validaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Cuentas Contables</p>
                          <p className="text-2xl font-bold text-green-700">{accountingEngine.getAccounts().length}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Terceros</p>
                          <p className="text-2xl font-bold text-blue-700">{accountingEngine.getThirdParties().length}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Períodos Abiertos</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {accountingEngine.getPeriods().filter(p => p.isOpen).length}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {validation && (
                  <div className="space-y-3">
                    {validation.errors.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Errores encontrados:</strong>
                          <ul className="mt-2 space-y-1">
                            {validation.errors.map((error, index) => (
                              <li key={index} className="text-sm">• {error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validation.warnings.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Advertencias:</strong>
                          <ul className="mt-2 space-y-1">
                            {validation.warnings.map((warning, index) => (
                              <li key={index} className="text-sm">• {warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validation.isValid && (
                      <Alert className="border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Todas las validaciones han sido exitosas. La factura está lista para contabilizar.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Plan de Cuentas Contables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Subtipo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountingEngine.getAccounts().map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.type}</Badge>
                      </TableCell>
                      <TableCell>{account.subtype}</TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "destructive"}>
                          {account.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración del Sistema Contable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cuenta de Inventarios</Label>
                  <Input value={defaultConfig.inventoryAccount} readOnly className="font-mono" />
                </div>
                <div>
                  <Label>Cuenta de IVA Descontable</Label>
                  <Input value={defaultConfig.vatAccount} readOnly className="font-mono" />
                </div>
                <div>
                  <Label>Cuenta de Retención en la Fuente</Label>
                  <Input value={defaultConfig.retentionFuenteAccount} readOnly className="font-mono" />
                </div>
                <div>
                  <Label>Cuenta de Retención de IVA</Label>
                  <Input value={defaultConfig.retentionIvaAccount} readOnly className="font-mono" />
                </div>
                <div>
                  <Label>Cuenta de Retención de ICA</Label>
                  <Input value={defaultConfig.retentionIcaAccount} readOnly className="font-mono" />
                </div>
                <div>
                  <Label>Cuenta de Proveedores</Label>
                  <Input value={defaultConfig.suppliersAccount} readOnly className="font-mono" />
                </div>
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Las cuentas contables están configuradas según los ejemplos proporcionados y las normativas DIAN 2025.
                  El sistema utiliza el Plan Único de Cuentas (PUC) colombiano.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para mostrar el asiento generado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asiento Contable Generado</DialogTitle>
          </DialogHeader>
          {generatedSeat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input value={new Date(generatedSeat.date).toLocaleDateString('es-CO')} readOnly />
                </div>
                <div>
                  <Label>Documento</Label>
                  <Input value={generatedSeat.documentNumber} readOnly />
                </div>
              </div>
              
              <div>
                <Label>Descripción</Label>
                <Input value={generatedSeat.description} readOnly />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tercero</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedSeat.entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">{entry.accountCode}</TableCell>
                      <TableCell>{entry.accountName}</TableCell>
                      <TableCell>{entry.thirdPartyName || '-'}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right">
                        {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Totales del Comprobante</p>
                  <div className="flex space-x-4">
                    <span className="font-medium">Débitos: {formatCurrency(generatedSeat.totalDebit)}</span>
                    <span className="font-medium">Créditos: {formatCurrency(generatedSeat.totalCredit)}</span>
                  </div>
                </div>
                <Badge variant={generatedSeat.totalDebit === generatedSeat.totalCredit ? "default" : "destructive"}>
                  {generatedSeat.totalDebit === generatedSeat.totalCredit ? "Cuadrado" : "Descuadrado"}
                </Badge>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePostEntry}
                  disabled={generatedSeat.totalDebit !== generatedSeat.totalCredit}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Contabilizar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}