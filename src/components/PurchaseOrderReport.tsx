import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrder, Supplier } from '@/types';
import { Building2, Calendar, FileText, Mail, Printer, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrderReportProps {
  order: PurchaseOrder;
  supplier: Supplier;
  onSendEmail: (order: PurchaseOrder) => void;
}

export default function PurchaseOrderReport({ order, supplier, onSendEmail }: PurchaseOrderReportProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleDownloadPDF = () => {
    // Implementar generación de PDF
    toast({
      title: "Generando PDF",
      description: "El archivo se descargará en unos momentos",
    });
  };

  const handleSendEmail = () => {
    onSendEmail(order);
    toast({
      title: "Enviando por correo",
      description: `Enviando orden ${order.consecutive} a ${supplier.email}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'RECEIVED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'APPROVED': return 'Aprobada';
      case 'SENT': return 'Enviada';
      case 'RECEIVED': return 'Recibida';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">Orden de Compra - {order.consecutive}</h2>
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={handleSendEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar por Correo
            </Button>
          </div>
        </div>
      </Card>

      {/* Printable Report */}
      <Card ref={printRef} className="print:shadow-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ORDEN DE COMPRA</h1>
                <div className="text-lg font-semibold text-blue-600"># {order.consecutive}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Fecha de Expedición</div>
                <div className="text-lg font-semibold">{new Date(order.expeditionDate).toLocaleDateString('es-ES')}</div>
              </div>
            </div>
          </div>

          {/* Company & Warehouse Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Información de la Empresa
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Bodega/Sede:</strong> {order.warehouseName}</div>
                <div><strong>Código:</strong> {order.warehouseCode}</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Información del Proveedor
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Razón Social:</strong> {supplier.name}</div>
                <div><strong>Documento:</strong> {order.supplierNit}</div>
                <div><strong>Dirección:</strong> {supplier.address}</div>
                <div><strong>Teléfono:</strong> {supplier.phone}</div>
                <div><strong>Email:</strong> {supplier.email}</div>
                <div><strong>Contacto:</strong> {supplier.contactPerson}</div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Productos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">Unidad</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Cantidad</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Precio Unit.</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">% Desc.</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">IVA</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm">{item.productName}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">{item.unit}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">${item.unitPrice.toLocaleString()}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">{item.discountRate}%</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">${item.subtotal.toLocaleString()}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">${item.taxAmount.toLocaleString()}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">${item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-mono">${order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Descuentos:</span>
                    <span className="font-mono text-red-600">-${order.totalDiscount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA:</span>
                    <span className="font-mono">${order.totalTax.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL:</span>
                      <span className="font-mono">${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones</h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Attached Documents */}
          {order.documents && order.documents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentos Adjuntos</h3>
              <div className="grid grid-cols-2 gap-4">
                {order.documents.map((doc, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border">
                    <FileText className="w-4 h-4 mr-2 text-gray-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{doc.fileName}</div>
                      <div className="text-xs text-gray-500">{doc.fileType} - {(doc.fileSize / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Términos y Condiciones</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Esta orden de compra es válida por 30 días.</p>
                  <p>• Los productos deben ser entregados en perfecto estado.</p>
                  <p>• Cualquier cambio debe ser aprobado por escrito.</p>
                  <p>• Términos de pago: {supplier.paymentTerms} días.</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  <p>Fecha de generación: {new Date().toLocaleDateString('es-ES')}</p>
                  <p>Hora: {new Date().toLocaleTimeString('es-ES')}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}